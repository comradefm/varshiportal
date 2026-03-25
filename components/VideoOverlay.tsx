"use client";
import React, { useEffect, useRef } from 'react';
import { useCall } from '@/context/CallContext';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const VideoOverlay = () => {
  const { localStream, remoteStream, isCallActive, isCalling, endCall } = useCall();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // If no partner stream and not calling, don't show anything
  if (!remoteStream && !isCalling) return null;

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -window.innerWidth + 200, right: 0, top: 0, bottom: window.innerHeight - 300 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {/* Remote Video (Partner) */}
      {(remoteStream || isCalling) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-40 h-52 md:w-48 md:h-64 bg-[#0d0d17] border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto cursor-grab ring-1 ring-white/10 group"
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover pointer-events-none select-none"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-pulse font-mono">Connecting</span>
            </div>
          )}
          
          {/* Drag Handle Indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full group-hover:bg-white/30 transition-colors" />
          
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg pointer-events-none">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
             <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Partner Live</span>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              endCall();
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg border border-white/5 active:scale-95"
            title="End Session"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoOverlay;
