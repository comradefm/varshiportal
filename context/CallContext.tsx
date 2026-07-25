"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CallSession } from '@/lib/callService';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';

interface CallContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isCalling: boolean;
  isInitialized: boolean;
  initializeMedia: () => Promise<void>;
  startCall: (roomId: string) => Promise<void>;
  endCall: () => Promise<void>;
  incomingCall: { roomId: string; fromName: string } | null;
  acceptCall: () => Promise<void>;
  connectionState: RTCIceConnectionState;
  activeRoomId: string | null;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userData } = useAuth();
  const pathname = usePathname();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; fromName: string } | null>(null);
  const [connectionState, setConnectionState] = useState<RTCIceConnectionState>('new');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  const callSessionRef = useRef<CallSession | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const initializeMedia = async () => {
    try {
      if (localStream) return;
      console.log("[CallContext] Auto-initializing media stream");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      setIsInitialized(true);
      sessionStorage.setItem('study_portal_initialized', 'true');
    } catch (err) {
      console.error("Media init failed:", err);
      setIsInitialized(true);
    }
  };

  // Auto-initialize media as soon as user logs in
  useEffect(() => {
    if (user && !isInitialized && !localStream) {
      initializeMedia();
    }
  }, [user, isInitialized, localStream]);

  const startCall = async (roomId: string) => {
    if (!user) return;
    if (callSessionRef.current) {
        console.warn("[CallContext] Cleaning up old session");
        await endCall();
    }
    try {
      console.log(`[CallContext] Starting call to room: ${roomId}`);
      setIsCalling(true);
      setConnectionState('new');
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
      }
      
      const session = new CallSession(roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = roomId;
      setActiveRoomId(roomId);

      session.onConnectionStateChange((state) => {
        setConnectionState(state);
      });

      session.onRemoteStream((remote) => {
        setRemoteStream(remote);
        setIsCallActive(true);
        setIsCalling(false);
      });

      await session.createOffer(stream, user.uid);
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsCalling(false);
    }
  };

  const acceptCall = async () => {
    const call = incomingCall;
    if (!call || !user) return;
    if (callSessionRef.current) await endCall();
    try {
      setConnectionState('new');
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
      }

      const session = new CallSession(call.roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = call.roomId;
      setActiveRoomId(call.roomId);

      session.onConnectionStateChange((state) => {
        setConnectionState(state);
      });

      session.onRemoteStream((remote) => {
        setRemoteStream(remote);
        setIsCallActive(true);
      });

      await session.answerCall(stream, user.uid);
      setIncomingCall(null);
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };

  const endCall = async () => {
    if (callSessionRef.current) {
      await callSessionRef.current.endCall();
    }
    setRemoteStream(null);
    setIsCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setConnectionState('closed');
    callSessionRef.current = null;
    currentRoomIdRef.current = null;
    setActiveRoomId(null);
  };

  useEffect(() => {
    const handleUnload = () => {
      if (callSessionRef.current) {
        callSessionRef.current.pc.close();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // 1. Listen for incoming calls across user's rooms via Supabase
  useEffect(() => {
    if (!user || !userData?.rooms || isCallActive || isCalling) return;
    const rooms = userData.rooms;
    if (rooms.length === 0) return;

    const channels = rooms.map((roomId: string) => {
      const channel = supabase.channel(`call_${roomId}`);
      channel.on("broadcast", { event: "offer" }, ({ payload }: any) => {
        if (payload?.senderId && payload.senderId !== user.uid) {
          const createdAt = payload.createdAt || Date.now();
          const isRecent = (Date.now() - createdAt) < 300000;
          if (isRecent) {
            setIncomingCall({ roomId, fromName: "Partner" });
          }
        }
      }).subscribe();
      return channel;
    });

    return () => channels.forEach((ch: any) => supabase.removeChannel(ch));
  }, [user, userData?.rooms, isCallActive, isCalling]);

  // 2. Auto-Accept incoming calls immediately without requiring user permission
  useEffect(() => {
    if (incomingCall && !isCallActive && !isCalling) {
      const primaryRoomId = userData?.primaryRoomId;
      const isFromPrimary = !primaryRoomId || incomingCall.roomId === primaryRoomId;
      
      if (isFromPrimary) {
        acceptCall();
      }
    }
  }, [incomingCall, isCallActive, isCalling, userData?.primaryRoomId]);

  // 3. Auto-Start video telecast as soon as partner is online
  useEffect(() => {
    if (!user || !userData?.rooms || userData.rooms.length === 0) return;
    if (isCallActive || isCalling || incomingCall) return;

    const targetRoomId = userData?.primaryRoomId || userData.rooms[0];
    if (!targetRoomId) return;
    
    const checkPartnerAndStart = async () => {
       if (isCallActive || isCalling || incomingCall) return;
       try {
         const { getPartnerData } = await import('@/lib/supabaseService');
         const partner = await getPartnerData(targetRoomId, user.uid);
         if (partner?.user_id && partner.isOnline && user.uid < partner.user_id) {
            startCall(targetRoomId);
         }
       } catch (err) {
         console.error("Auto-start check failed:", err);
       }
    };
    const timer = setTimeout(checkPartnerAndStart, 1500); 
    return () => clearTimeout(timer);
  }, [isCallActive, isCalling, incomingCall, user, userData?.rooms, userData?.primaryRoomId]);

  return (
    <CallContext.Provider value={{ 
      localStream, remoteStream, isCallActive, isCalling, isInitialized,
      initializeMedia, startCall, endCall, incomingCall, acceptCall, connectionState, activeRoomId
    }}>
      {children}
    </CallContext.Provider>
  );
};
