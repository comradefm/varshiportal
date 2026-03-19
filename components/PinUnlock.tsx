"use client";
import { useState } from "react";
import { verifyPin } from "@/lib/pinUtils";

interface PinUnlockProps {
  storedHash: string;
  onUnlock: () => void;
  onClose: () => void;
}

export default function PinUnlock({ storedHash, onUnlock, onClose }: PinUnlockProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleKey = async (key: string) => {
    if (checking) return;

    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length === 4) {
      setChecking(true);
      const valid = await verifyPin(newPin, storedHash);
      if (valid) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
          setChecking(false);
        }, 500);
      }
    }
  };

  const dots = [0, 1, 2, 3];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm px-6">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full max-w-xs">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Enter PIN</h2>
          <p className="text-zinc-600 text-sm mt-1">Enter your 4-digit security PIN</p>
        </div>

        {/* Dots */}
        <div className={`flex justify-center gap-5 mb-10 ${shake ? "animate-shake" : ""}`}>
          {dots.map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? "bg-indigo-500 border-indigo-500 scale-110"
                  : "bg-transparent border-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {["1","2","3","4","5","6","7","8","9"].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white text-xl font-semibold transition-all duration-100 border border-zinc-800 hover:border-zinc-700"
            >
              {n}
            </button>
          ))}
          {/* Empty, 0, Backspace */}
          <div />
          <button
            onClick={() => handleKey("0")}
            className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white text-xl font-semibold transition-all duration-100 border border-zinc-800 hover:border-zinc-700"
          >
            0
          </button>
          <button
            onClick={() => handleKey("⌫")}
            className="h-16 rounded-2xl bg-red-950/60 hover:bg-red-950/80 active:bg-red-900/80 text-red-400 text-lg transition-all duration-100 border border-red-900/30"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
