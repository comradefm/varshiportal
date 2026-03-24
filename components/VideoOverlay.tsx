"use client";
import React, { useEffect, useRef } from 'react';
import { useCall } from '@/context/CallContext';

const VideoOverlay = () => {
  const { localStream, remoteStream, isCallActive, isCalling, endCall } = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!localStream && !isCalling) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {/* Remote Video (Large) */}
      {(remoteStream || isCalling) && (
        <div className="relative w-48 h-64 md:w-56 md:h-72 bg-[#0d0d17] border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase letter-spacing-widest">Calling...</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
             <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Partner</span>
          </div>
          
          <button 
            onClick={endCall}
            className="absolute top-3 right-3 w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Local Video (Small Overlay) */}
      {localStream && (
        <div className="relative self-end w-32 h-44 bg-[#0d0d17] border border-[#27273a] rounded-xl overflow-hidden shadow-xl pointer-events-auto ring-1 ring-white/5">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover grayscale-[20%]"
          />
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm border border-white/5 rounded-md">
             <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter">You</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoOverlay;
