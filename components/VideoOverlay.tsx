"use client";
import React from 'react';
import { useCall } from '@/context/CallContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

const VideoOverlay = () => {
  const { localStream, remoteStream, isCalling, endCall, connectionState } = useCall();
  const { userData } = useAuth();
  const [playFailed, setPlayFailed] = React.useState(false);

  const attachStream = (el: HTMLVideoElement | null, stream: MediaStream | null, name: string) => {
    if (el && stream && el.srcObject !== stream) {
      console.log(`[VideoOverlay] Attaching ${name} stream`);
      el.srcObject = stream;
      el.muted = true;
      el.play().catch(e => {
        console.error(`[VideoOverlay] ${name} play failed:`, e);
        if (name === 'remote') setPlayFailed(true);
      });
    }
  };

  if (!(remoteStream || isCalling || localStream)) return null;

  const getStatusText = () => {
    switch (connectionState) {
      case 'checking': return 'Connecting';
      case 'failed': return 'Failed';
      case 'disconnected': return 'Disconnected';
      case 'closed': return 'Ended';
      default: return 'Waiting';
    }
  };

  return (
    <motion.div 
      drag
      dragConstraints={{ left: -window.innerWidth + 200, right: 0, top: 0, bottom: window.innerHeight - 300 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      className="fixed top-20 right-6 z-[99999] flex flex-col gap-3 pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-44 h-60 md:w-52 md:h-68 bg-[#0b0a14] border border-rose-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/60 pointer-events-auto cursor-grab ring-1 ring-white/10 group backdrop-blur-md"
      >
        <video
          ref={(el) => attachStream(el, remoteStream, 'remote')}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover pointer-events-none select-none bg-black"
        />

        {playFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 transition-all">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPlayFailed(false);
                const vid = e.currentTarget.parentElement?.querySelector('video');
                if (vid) vid.play().catch(console.error);
              }}
              className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center shadow-2xl shadow-rose-600/40 hover:scale-110 active:scale-95 transition-all text-white pointer-events-auto"
            >
              <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <span className="mt-3 text-[10px] font-bold text-rose-300 uppercase tracking-widest animate-pulse">Tap Video</span>
          </div>
        )}

        {/* Local Video Preview (Self) */}
        {localStream && (
          <div className="absolute top-3 left-3 w-12 h-16 md:w-14 md:h-20 bg-zinc-900 border border-white/20 rounded-xl overflow-hidden z-10 shadow-lg ring-1 ring-black/50">
            <video
              ref={(el) => attachStream(el, localStream, 'local')}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror local view
            />
          </div>
        )}
        
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none px-4 text-center">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest animate-pulse font-mono">
              {getStatusText()}
            </span>
          </div>
        )}
        
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
        
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl pointer-events-none">
           <div className={`w-1.5 h-1.5 rounded-full ${remoteStream ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]`} />
           <span className="text-[9px] font-bold text-white uppercase tracking-wider">
             {remoteStream ? 'Live Telecast' : 'Connecting...'}
           </span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            endCall();
          }}
          className="absolute top-3 right-3 w-7 h-7 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg border border-white/5 active:scale-95"
          title="End Telecast"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default VideoOverlay;
