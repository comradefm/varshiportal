"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createRoom, joinRoom, getRoomData } from "@/firebase/roomService";

export default function Pairing() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (userData?.room_id) {
      getRoomData(userData.room_id).then((data) => {
        if (data) setRoomData(data);
      });
    }
  }, [userData]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setError(""); setSuccess(""); setCreating(true);
    try {
      const result = await createRoom(user.uid);
      setRoomCode(result.room_code);
      await refreshUserData(user.uid);
      const data = await getRoomData(result.room_id);
      setRoomData(data);
      setSuccess("Room created! Share the code with your partner.");
    } catch (err: any) {
      setError(err.message || "Failed to create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return setError("Please enter a room code.");
    setError(""); setSuccess(""); setJoining(true);
    try {
      const result = await joinRoom(joinCode.trim(), user.uid);
      await refreshUserData(user.uid);
      const data = await getRoomData(result.room_id);
      setRoomData(data);
      setSuccess("Joined successfully! You are now paired.");
    } catch (err: any) {
      setError(err.message || "Failed to join room.");
    } finally {
      setJoining(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already paired — show status and go to chat
  if (roomData && roomData.user_1 && roomData.user_2) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-[#1c1c27] flex items-center justify-center hover:bg-[#27272a] transition">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-white">Connection</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">You&apos;re Paired!</h2>
          <p className="text-sm text-zinc-500 text-center mb-2">Your connection is active and permanent.</p>
          <div className="bg-[#13131a] border border-emerald-500/20 rounded-2xl px-6 py-3 mb-8">
            <p className="text-xs text-zinc-500 text-center mb-1">Room Code</p>
            <p className="font-mono font-bold text-emerald-400 text-xl tracking-widest text-center">{roomData.room_code}</p>
          </div>
          <button
            id="go-to-chat-btn"
            onClick={() => router.push("/chat")}
            className="w-full max-w-xs py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm transition"
          >
            Open Chat →
          </button>
        </main>
      </div>
    );
  }

  // If room exists but waiting for a partner
  if (roomData && roomData.user_1 && !roomData.user_2) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-[#1c1c27] flex items-center justify-center hover:bg-[#27272a] transition">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-semibold text-white">Connection Setup</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Waiting for partner...</h2>
          <p className="text-sm text-zinc-500 text-center mb-6">Share this code so they can join your room.</p>
          
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl px-8 py-5 mb-8 text-center ring-1 ring-white/5">
            <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">Your Room Code</p>
            <p className="font-mono font-bold text-indigo-400 text-3xl tracking-[0.2em]">{roomData.room_code}</p>
          </div>
        </main>
      </div>
    );
  }

  // Otherwise, user needs to create or join a room
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-[#1c1c27] flex items-center justify-center hover:bg-[#27272a] transition">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-semibold text-white">Connection Setup</h1>
      </header>

      <main className="px-5 py-8 max-w-sm mx-auto space-y-5 animate-fade-in">
        <p className="text-sm text-zinc-500 text-center">
          Connect with your partner by creating or joining a private room.
        </p>

        {/* Feedback messages */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            {success}
          </div>
        )}

        {/* Create Room */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="font-semibold text-white">Create Room</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-6">Generate a secure room code for your partner to join.</p>

          <button
            id="create-room-btn"
            onClick={handleCreateRoom}
            disabled={creating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition flex items-center justify-center gap-2"
          >
            {creating ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
            ) : (
              "Create Room"
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#27272a]" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="flex-1 h-px bg-[#27272a]" />
        </div>

        {/* Join Room */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="font-semibold text-white">Join Room</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-6">Enter the room code your partner shared with you.</p>
          <div className="flex gap-2">
            <input
              id="join-code-input"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="RM-XXXX"
              maxLength={7}
              className="flex-1 px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono tracking-widest text-center uppercase"
            />
            <button
              id="join-room-btn"
              onClick={handleJoinRoom}
              disabled={joining}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition flex items-center justify-center"
            >
              {joining ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Join"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
