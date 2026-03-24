"use client";
import React, { useState, useEffect } from 'react';

interface WelcomeOverlayProps {
  onContinue: () => void;
}

const WelcomeOverlay = ({ onContinue }: WelcomeOverlayProps) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!agreed) return;
    setLoading(true);
    await onContinue();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#080810] flex items-center justify-center p-4 lg:p-0 animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-[#0d0d17] border border-[#1a1a2e] rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />
        
        <header className="text-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to StudyPortal</h1>
          <p className="text-zinc-500 text-sm">Please review our collaboration terms to continue.</p>
        </header>

        <div className="bg-[#151523] border border-[#27273a] rounded-2xl p-6 mb-8 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
            <section>
              <h3 className="font-bold text-zinc-200 mb-1">1. Private Collaboration</h3>
              <p>StudyPortal is built for focused, private interaction between study partners. Your activity is kept secure and hidden from the public dashboard.</p>
            </section>
            <section>
              <h3 className="font-bold text-zinc-200 mb-1">2. Visual Connection</h3>
              <p>To ensure active participation, real-time video connection is mandatory during study sessions. Audio is disabled by default for deep focus.</p>
            </section>
            <section>
              <h3 className="font-bold text-zinc-200 mb-1">3. Privacy & Safety</h3>
              <p>We do not store or record your video streams. All connections are peer-to-peer (WebRTC) and encrypted for your safety.</p>
            </section>
            <section>
              <h3 className="font-bold text-zinc-200 mb-1">4. Conduct</h3>
              <p>Users must maintain a professional and respectful environment. Any misuse of features will result in permanent account suspension.</p>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700 group-hover:border-indigo-500'}`}>
              {agreed && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <input 
                type="checkbox" 
                className="hidden" 
                checked={agreed} 
                onChange={() => setAgreed(!agreed)} 
              />
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors select-none">I agree to the terms and privacy policy</span>
          </label>

          <button
            onClick={handleContinue}
            disabled={!agreed || loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-8 uppercase tracking-widest font-bold">Secure Environment Protected</p>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
