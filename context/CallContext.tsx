"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CallSession } from '@/firebase/callService';
import { db } from '@/firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
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
  
  const callSessionRef = useRef<CallSession | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const initializeMedia = async () => {
    try {
      if (localStream) return; // Already initialized
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      setIsInitialized(true);
      sessionStorage.setItem('study_portal_initialized', 'true');
    } catch (err) {
      console.error("Media init failed:", err);
    }
  };

  useEffect(() => {
     const saved = sessionStorage.getItem('study_portal_initialized');
     if (saved === 'true') {
       setIsInitialized(true);
     }
  }, []);
  const startCall = async (roomId: string) => {
    if (!user) return;
    if (callSessionRef.current) {
        console.warn("[CallContext] Call already in progress, cleaning up old session");
        await endCall();
    }
    try {
      console.log(`[CallContext] Starting call to room: ${roomId}`);
      setIsCalling(true);
      setConnectionState('new');
      let stream = localStream;
      if (!stream) {
        console.log("[CallContext] No local stream, requesting media...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
      }
      
      const session = new CallSession(roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = roomId;

      session.onConnectionStateChange((state) => {
        console.log(`[CallContext] Connection state changed: ${state}`);
        setConnectionState(state);
      });

      session.onRemoteStream((remote) => {
        console.log("[CallContext] Remote stream received in context");
        setRemoteStream(remote);
        setIsCallActive(true);
        setIsCalling(false);
      });

      await session.createOffer(stream, user.uid);
      console.log("[CallContext] Offer created and sent");
    } catch (err) {
      console.error("[CallContext] Failed to start call:", err);
      setIsCalling(false);
    }
  };

  const acceptCall = async () => {
    const call = incomingCall;
    if (!call || !user) return;
    if (callSessionRef.current) {
        console.warn("[CallContext] Already in session, cleaning up before accepting");
        await endCall();
    }
    try {
      console.log(`[CallContext] Accepting call from room: ${call.roomId}`);
      setConnectionState('new');
      let stream = localStream;
      if (!stream) {
        console.log("[CallContext] No local stream, requesting media...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
      }

      const session = new CallSession(call.roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = call.roomId;

      session.onConnectionStateChange((state) => {
        console.log(`[CallContext] Connection state changed: ${state}`);
        setConnectionState(state);
      });

      session.onRemoteStream((remote) => {
        console.log("[CallContext] Remote stream received in context");
        setRemoteStream(remote);
        setIsCallActive(true);
      });

      await session.answerCall(stream, user.uid);
      console.log("[CallContext] Answer created and sent");
      setIncomingCall(null);
    } catch (err) {
      console.error("[CallContext] Failed to accept call:", err);
    }
  };

  const endCall = async () => {
    console.log("[CallContext] Ending call...");
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
    console.log("[CallContext] Session cleared");
  };

  // Cleanup on tab close/nav
  useEffect(() => {
    const handleUnload = () => {
      if (callSessionRef.current) {
        const callDoc = doc(db, "rooms", currentRoomIdRef.current!, "call", "current_call");
        callSessionRef.current.pc.close();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // --- NEW: Global Signaling & Auto-Management (Conditional) ---

  // 1. Listen for incoming calls
  useEffect(() => {
    if (!user || !userData?.rooms || isCallActive || isCalling) return;

    const rooms = userData.rooms;
    if (rooms.length === 0) return;

    const unsubs = rooms.map((roomId: string) => {
      const callDoc = doc(db, "rooms", roomId, "call", "current_call");
      return onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !data.answer) {
          const isFromPartner = data.offer.senderId !== user.uid;
          const createdAt = data.offer.createdAt?.toMillis() || Date.now();
          const isRecent = (Date.now() - createdAt) < 300000;
          
          if (isFromPartner && isRecent) {
             setIncomingCall({ roomId, fromName: "Study Partner" });
          }
        } else if (!data?.offer) {
          setIncomingCall(prev => prev?.roomId === roomId ? null : prev);
        }
      });
    });

    return () => unsubs.forEach((unsub: any) => unsub());
  }, [user, userData?.rooms, isCallActive, isCalling]);

  // 2. Auto-Accept (Respect Toggle and Path)
  useEffect(() => {
    if (isInitialized && incomingCall && !isCallActive && !isCalling) {
      const isAlwaysOn = !!userData?.alwaysOnVideo;
      const isInChat = pathname === '/chat';
      
      if (isAlwaysOn || isInChat) {
        console.log("Auto-accepting call (Always-on or Chat)");
        acceptCall();
      }
    }
  }, [isInitialized, incomingCall, isCallActive, isCalling, userData?.alwaysOnVideo, pathname]);

  // 3. Auto-Start (Respect Toggle and Path)
  useEffect(() => {
    if (!user || !userData?.rooms || userData.rooms.length === 0) return;
    if (!isInitialized || isCallActive || isCalling || incomingCall) return;

    const isAlwaysOn = !!userData?.alwaysOnVideo;
    const isInChat = pathname === '/chat';
    if (!isAlwaysOn && !isInChat) return;

    const primaryRoomId = userData.rooms[0];
    
    const checkPartnerAndStart = async () => {
       if (isCallActive || isCalling || incomingCall) return;

       try {
         const { getPartnerData } = await import('@/firebase/roomService');
         const partner = await getPartnerData(primaryRoomId, user.uid);
         
         if (partner?.uid && partner.isOnline) {
            if (user.uid < partner.uid) {
               startCall(primaryRoomId);
            }
         }
       } catch (err) {
         console.error("Auto-start check failed:", err);
       }
    };

    const timer = setTimeout(checkPartnerAndStart, 2000); 
    return () => clearTimeout(timer);
  }, [isInitialized, isCallActive, isCalling, incomingCall, user, userData?.rooms, userData?.alwaysOnVideo, pathname]);

  return (
    <CallContext.Provider value={{ 
      localStream, 
      remoteStream, 
      isCallActive, 
      isCalling,
      isInitialized,
      initializeMedia,
      startCall, 
      endCall, 
      incomingCall, 
      acceptCall,
      connectionState
    }}>
      {children}
    </CallContext.Provider>
  );
};
