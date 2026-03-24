"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CallSession } from '@/firebase/callService';
import { db } from '@/firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

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
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; fromName: string } | null>(null);
  
  const callSessionRef = useRef<CallSession | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      setIsInitialized(true);
      // Store initialization in sessionStorage for the duration of tab
      sessionStorage.setItem('study_portal_initialized', 'true');
    } catch (err) {
      console.error("Media init failed:", err);
    }
  };

  useEffect(() => {
     const saved = sessionStorage.getItem('study_portal_initialized');
     if (saved === 'true') setIsInitialized(true);
  }, []);

  const startCall = async (roomId: string) => {
    try {
      setIsCalling(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);
      
      const session = new CallSession(roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = roomId;

      session.onRemoteStream((remote) => {
        setRemoteStream(remote);
        setIsCallActive(true);
        setIsCalling(false);
      });

      await session.createOffer(stream);
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsCalling(false);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalStream(stream);

      const session = new CallSession(incomingCall.roomId);
      callSessionRef.current = session;
      currentRoomIdRef.current = incomingCall.roomId;

      session.onRemoteStream((remote) => {
        setRemoteStream(remote);
        setIsCallActive(true);
      });

      await session.answerCall(stream);
      setIncomingCall(null);
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };

  const endCall = async () => {
    if (callSessionRef.current) {
      await callSessionRef.current.endCall();
    }
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    callSessionRef.current = null;
    currentRoomIdRef.current = null;
  };

  // Listen for incoming calls (simplified: assuming user is in rooms)
  // In a real app, you'd subscribe to all user's rooms for an 'offer'
  // For this MVP, we'll implement a simpler trigger in the Chat page

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
      acceptCall 
    }}>
      {children}
    </CallContext.Provider>
  );
};
