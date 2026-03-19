"use client";
import { useState } from "react";

interface RoomJoinProps {
  onJoin: (code: string) => void;
  loading?: boolean;
}

export default function RoomJoin({ onJoin, loading = false }: RoomJoinProps) {
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    if (code.trim()) onJoin(code.trim());
  };

  return (
    <div className="p-6 bg-[#13131a] border border-[#27272a] rounded-2xl">
      <h2 className="text-lg font-semibold text-emerald-400 mb-2">Join Room</h2>
      <p className="text-sm text-zinc-500 mb-4">Enter the code your partner shared.</p>
      <div className="flex gap-2">
        <input
          id="roomjoin-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="RM-XXXX"
          maxLength={7}
          className="flex-1 px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono tracking-widest text-center"
        />
        <button
          id="roomjoin-btn"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition"
        >
          {loading ? "…" : "Join"}
        </button>
      </div>
    </div>
  );
}
