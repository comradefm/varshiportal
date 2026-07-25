"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, subscribeToMessages, toggleReaction, subscribeToTypingStatus, markMessagesAsSeen, setTypingStatus } from "@/lib/supabaseService";
import { getRoomData, getPartnerData, getUserRooms, createRoom, joinRoom } from "@/lib/supabaseService";
import { useCall } from "@/context/CallContext";
import ChatBox from "@/components/ChatBox";
import MessageBubble from "@/components/MessageBubble";
import VoiceRecorder from "@/components/VoiceRecorder";
import Link from "next/link";

const THEMES = [
  { id: "velvet", name: "Velvet Crimson 🌹", bg: "bg-[#0b0811]", accent: "border-rose-500/30", text: "text-rose-400" },
  { id: "obsidian", name: "Midnight Obsidian 🖤", bg: "bg-[#07070b]", accent: "border-purple-500/30", text: "text-purple-400" },
  { id: "cyber", name: "Cyber Rose 💖", bg: "bg-[#0f0716]", accent: "border-pink-500/30", text: "text-pink-400" },
  { id: "amethyst", name: "Deep Amethyst 🔮", bg: "bg-[#0d091a]", accent: "border-indigo-500/30", text: "text-indigo-400" },
];

export default function Chat() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingStatuses, setTypingStatuses] = useState<Record<string, boolean>>({});
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; senderName: string } | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastActive, setPartnerLastActive] = useState<any>(null);

  const lastClickTimeRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startCall, endCall, isCallActive, isCalling } = useCall();

  // ── 2-Tap Panic Double-Tap Exit (Secret Chat -> Study Portal Decoy)
  const handleDoubleTapExit = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea')) return;
    
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTimeRef.current;
    
    if (timeDiff >= 0 && timeDiff < 800) {
      router.push("/dashboard");
      lastClickTimeRef.current = 0;
    } else {
      lastClickTimeRef.current = currentTime;
    }
  };

  // Subscribe to active partner's presence in real-time
  useEffect(() => {
    if (!activeRoomId) {
      setPartnerOnline(false);
      setPartnerLastActive(null);
      return;
    }
    const room = rooms.find(r => r.room_id === activeRoomId);
    const partnerId = room?.partner?.uid || room?.partner?.user_id;
    if (!partnerId) {
      setPartnerOnline(false);
      setPartnerLastActive(null);
      return;
    }

    const { subscribeToUserData } = require("@/lib/supabaseService");
    const unsub = subscribeToUserData(partnerId, (data: any) => {
      if (data) {
        setPartnerOnline(!!data.isOnline);
        setPartnerLastActive(data.lastActive);
      } else {
        setPartnerOnline(false);
        setPartnerLastActive(null);
      }
    });

    return () => { if (unsub) unsub(); };
  }, [activeRoomId, rooms]);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    try {
      const userRooms = await getUserRooms(user.uid);
      const enriched = await Promise.all(
        userRooms.map(async (r) => {
          const { getPartnerData } = await import("@/lib/supabaseService");
          const partner = await getPartnerData(r.room_id, user.uid);
          return { ...r, partner };
        })
      );
      setRooms(enriched);
      if (enriched.length > 0 && !activeRoomId) {
        setActiveRoomId(userData?.primaryRoomId || enriched[0].room_id);
      }
    } catch (err) {
      console.error("Error loading rooms:", err);
    }
  }, [user, activeRoomId, userData?.primaryRoomId]);

  useEffect(() => {
    if (userData?.rooms) {
      loadRooms();
    }
  }, [userData?.rooms, loadRooms]);

  useEffect(() => {
    if (!activeRoomId) return;
    setMessages([]);
    setTypingStatuses({});
    
    // subscribeToTypingStatus & markMessagesAsSeen imported from top-level supabaseService
    
    const unsubMessages = subscribeToMessages(activeRoomId, (msgs: any[]) => {
      setMessages(msgs);
      if (user) markMessagesAsSeen(activeRoomId, user.uid);
    });
    
    const unsubTyping = subscribeToTypingStatus(activeRoomId, setTypingStatuses);
    if (user) markMessagesAsSeen(activeRoomId, user.uid);

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [activeRoomId, user]);

  useEffect(() => {
    if (!activeRoomId || !user) return;
    // setTypingStatus imported from top-level supabaseService

    if (text.length > 0) {
      setTypingStatus(activeRoomId, user.uid, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(activeRoomId, user.uid, false);
      }, 3000);
    } else {
      setTypingStatus(activeRoomId, user.uid, false);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [text, activeRoomId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user || !activeRoomId || sending) return;
    setSending(true);
    const msg = text.trim();
    const replyContext = replyTo;
    setText("");
    setReplyTo(null);
    try {
      // sendMessage & setTypingStatus imported from top-level supabaseService
      await sendMessage(activeRoomId, user.uid, msg, replyContext);
      await setTypingStatus(activeRoomId, user.uid, false);
    } catch (err) {
      console.error("Send failed:", err);
      setText(msg);
      setReplyTo(replyContext);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendVoice = async (audioBase64: string, durationSec: number) => {
    if (!user || !activeRoomId) return;
    try {
      // sendMessage imported from top-level supabaseService
      await sendMessage(activeRoomId, user.uid, "", replyTo, {
        url: audioBase64,
        type: "audio",
        duration: durationSec,
      });
      setShowVoiceRecorder(false);
      setReplyTo(null);
    } catch (err) {
      console.error("Voice send failed:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !activeRoomId) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        let url = reader.result as string;
        const type = file.type.startsWith("video/") ? "video" : "image";
        
        // Smart image compression: shrink 5MB photos down to ~300KB
        if (type === "image") {
          const { compressImageDataUrl } = await import("@/lib/imageCompressor");
          url = await compressImageDataUrl(url, 1200, 0.75);
        }

        try {
          // sendMessage imported from top-level supabaseService
          await sendMessage(activeRoomId, user.uid, "", replyTo, { url, type });
          setReplyTo(null);
        } catch (err) {
          console.error("Media send failed:", err);
        }
      };
    });
    // Reset file input value so user can select same files again if needed
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    setModalLoading(true); setModalError("");
    try {
      await createRoom(user.uid);
      await refreshUserData(user.uid);
    } catch (err: any) {
      setModalError(err.message || "Failed to create connection.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return setModalError("Please enter a code.");
    setModalLoading(true); setModalError("");
    try {
      await joinRoom(joinCode.trim(), user.uid);
      await refreshUserData(user.uid);
      setJoinCode("");
      setShowJoinModal(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to join room.");
    } finally {
      setModalLoading(false);
    }
  };

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return "";
    let date: Date;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp instanceof Date) date = timestamp;
    else if (typeof timestamp === 'number') date = new Date(timestamp);
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Offline";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Active just now";
    if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return "Active today";
    return `Active ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070b]">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myNickname = userData?.nickname || userData?.username || "Me";
  const activeRoomData = rooms.find(r => r.room_id === activeRoomId);
  const partnerNickname = activeRoomData?.partner?.nickname || activeRoomData?.partner?.username || "Love Partner 💖";

  return (
    <div className={`h-screen flex ${activeTheme.bg} text-white overflow-hidden transition-colors duration-500`} onClick={handleDoubleTapExit} style={{ touchAction: 'manipulation' }}>
      
      {/* Hidden File Input for Multi-Media Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*"
        multiple={true}
        className="hidden"
      />

      {/* Sidebar Connections */}
      <aside className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-rose-950/40 bg-[#090812] ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        <header className="px-5 py-5 border-b border-rose-950/40 flex items-center justify-between sticky top-0 z-10 bg-[#090812]/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-xl bg-rose-950/30 border border-rose-800/30 flex items-center justify-center text-rose-400 hover:bg-rose-900/40 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent">Secret Space 🌹</h1>
          </div>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="w-8 h-8 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 flex items-center justify-center transition border border-rose-500/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>

        {/* Theme Picker Bar */}
        <div className="px-4 py-2 border-b border-rose-950/30 flex gap-2 overflow-x-auto no-scrollbar">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all whitespace-nowrap border ${
                activeTheme.id === theme.id ? "bg-rose-600/30 border-rose-500 text-white shadow-lg shadow-rose-950" : "bg-black/20 border-white/10 text-zinc-400"
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {rooms.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-rose-300/60">No active partner connected yet.</p>
              <button onClick={handleCreateRoom} disabled={modalLoading} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl text-xs font-bold text-white shadow-lg hover:brightness-110 transition">
                Create Partner Connection 💖
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {rooms.map((room) => {
                const isSelected = activeRoomId === room.room_id;
                const pName = room.partner?.nickname || room.partner?.username || "Waiting for partner...";
                return (
                  <button
                    key={room.room_id}
                    onClick={() => setActiveRoomId(room.room_id)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl transition flex flex-col gap-1 ${isSelected ? 'bg-rose-600/15 border border-rose-500/30' : 'hover:bg-rose-950/20'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-rose-400' : 'text-zinc-200'}`}>{pName}</span>
                        {room.partner?.isOnline && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                      </div>
                    </div>
                    <div className="flex items-center text-[10px] text-zinc-500">
                      <span>Room Code: <span className="font-mono text-rose-300">{room.room_code}</span></span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Secret Chat Area */}
      <main className={`flex-1 flex flex-col min-w-0 relative ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
            <h2 className="text-2xl font-bold text-rose-300 mb-2">Secret Lovers Space 💖</h2>
            <p className="text-sm text-zinc-500 max-w-sm">Select a partner room to start texting & telecasting live video.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex-shrink-0 bg-[#090812]/95 backdrop-blur border-b border-rose-950/40 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden w-8 h-8 rounded-lg bg-rose-950/40 flex items-center justify-center text-rose-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-white text-base truncate">{partnerNickname}</h2>
                    {partnerOnline && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {partnerOnline ? (
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active Now</span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-medium">{formatLastSeen(partnerLastActive) || "Offline"}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => isCallActive ? endCall() : (activeRoomId && startCall(activeRoomId))}
                  disabled={isCalling}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-lg border ${isCallActive ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30' : 'bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30'}`}
                  title="Toggle Video Telecast"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Chat Messages */}
            <ChatBox>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-1 mt-auto">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.uid;
                  return (
                    <div key={msg.message_id} id={`msg-${msg.message_id}`} className="group relative">
                      <MessageBubble
                        id={msg.message_id}
                        text={msg.message_text}
                        senderName={isOwn ? myNickname : partnerNickname}
                        isOwnMessage={isOwn}
                        replyTo={msg.reply_to}
                        status={isOwn ? msg.status : undefined}
                        mediaUrl={msg.media_url}
                        mediaType={msg.media_type}
                        duration={msg.duration}
                        reactions={msg.reactions}
                        onToggleReaction={(emoji) => toggleReaction(msg.message_id, user!.uid, emoji)}
                        onReplyTrigger={() => setReplyTo({ id: msg.message_id, text: msg.message_text || "Attachment", senderName: isOwn ? myNickname : partnerNickname })}
                        onReplyClick={(id) => {
                          const el = document.getElementById(`msg-${id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                      />
                    </div>
                  );
                })}

                {/* Typing status dots */}
                {Object.entries(typingStatuses).some(([uid, isTyping]) => uid !== user?.uid && isTyping) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
                    <span className="text-xs text-rose-300 font-medium italic">{partnerNickname} is typing... 💕</span>
                  </div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            </ChatBox>

            {/* Footer / Input Bar */}
            <footer className="bg-[#090812]/90 backdrop-blur border-t border-rose-950/40 px-4 md:px-6 py-4">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
                {/* Reply Quote Banner */}
                {replyTo && (
                  <div className="flex items-center justify-between bg-[#151122] border border-rose-500/30 rounded-xl px-4 py-2 mb-1 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col min-w-0 border-l-2 border-rose-500 pl-3">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        Replying to {replyTo.senderName}
                      </span>
                      <p className="text-xs text-zinc-300 truncate mt-0.5">{replyTo.text}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white p-1 ml-4">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Voice Recorder Overlay or Standard Input Bar */}
                {showVoiceRecorder ? (
                  <VoiceRecorder
                    onSendVoice={handleSendVoice}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Media upload button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-11 h-11 rounded-2xl bg-rose-950/40 border border-rose-800/30 flex items-center justify-center text-rose-300 hover:bg-rose-900/50 transition active:scale-95"
                      title="Send Image / Video"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {/* Mic button for Voice Note */}
                    <button
                      onClick={() => setShowVoiceRecorder(true)}
                      className="w-11 h-11 rounded-2xl bg-rose-950/40 border border-rose-800/30 flex items-center justify-center text-rose-300 hover:bg-rose-900/50 transition active:scale-95"
                      title="Record Voice Note"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>

                    {/* Text Input Box */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send a secret message… 💕"
                      className="flex-1 bg-[#141021] border border-rose-500/25 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition placeholder-zinc-500"
                    />

                    {/* Send Button */}
                    <button
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className="w-11 h-11 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-950 hover:brightness-110 active:scale-95 disabled:opacity-40 transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Join/Create Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0a18] border border-rose-500/30 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-5 right-5 text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-rose-300 mb-6">Create / Join Secret Room 🌹</h2>
            <div className="space-y-4">
              <button onClick={handleCreateRoom} className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl shadow-lg">Generate Room Code</button>
              <div className="flex gap-2">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="RM-XXXX" className="flex-1 bg-[#120e20] border border-rose-500/30 text-white rounded-xl px-4 text-center tracking-widest font-mono" />
                <button onClick={handleJoinRoom} className="px-5 py-3 bg-rose-700 text-white rounded-xl font-semibold">Join</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
