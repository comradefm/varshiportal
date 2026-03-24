"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, subscribeToMessages } from "@/firebase/chatService";
import { getRoomData, getPartnerData, getUserRooms, createRoom, joinRoom } from "@/firebase/roomService";
import { db } from "@/firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useCall } from "@/context/CallContext";
import ChatBox from "@/components/ChatBox";
import MessageBubble from "@/components/MessageBubble";
import Link from "next/link";

export default function Chat() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typingStatuses, setTypingStatuses] = useState<Record<string, boolean>>({});
  const [replyTo, setReplyTo] = useState<any | null>(null);
  
  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastActive, setPartnerLastActive] = useState<any>(null);

  const lastClickTimeRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { startCall, isCallActive, isCalling, acceptCall, isInitialized } = useCall();
  const [hasIncomingOffer, setHasIncomingOffer] = useState(false);

  // Auto-start or auto-join session if initialized
  useEffect(() => {
    if (isInitialized && activeRoomId && !isCallActive && !isCalling) {
      // If there's an incoming offer, we could auto-join, but let's just start to be safe
      // Actually, if an offer exists, we should auto-accept.
      if (hasIncomingOffer) {
        acceptCall();
      } else {
        startCall(activeRoomId);
      }
    }
  }, [isInitialized, activeRoomId, hasIncomingOffer, isCallActive, isCalling, startCall, acceptCall]);

  // Listen for incoming call in the active room
  useEffect(() => {
    if (!activeRoomId || isCallActive || isCalling) {
      setHasIncomingOffer(false);
      return;
    }
    const callDoc = doc(db, "rooms", activeRoomId, "call", "current_call");
    const unsub = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offer && !data.answer) {
        setHasIncomingOffer(true);
      } else {
        setHasIncomingOffer(false);
      }
    });
    return () => unsub();
  }, [activeRoomId, isCallActive, isCalling]);

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
    if (!room?.partner?.uid) {
      setPartnerOnline(false);
      setPartnerLastActive(null);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", room.partner.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartnerOnline(!!data.isOnline);
        setPartnerLastActive(data.lastActive);
      } else {
        setPartnerOnline(false);
        setPartnerLastActive(null);
      }
    });

    return () => unsub();
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
          const { getPartnerData } = await import("@/firebase/roomService");
          const partner = await getPartnerData(r.room_id, user.uid);
          return { ...r, partner };
        })
      );
      setRooms(enriched);
    } catch (err) {
      console.error("Error loading rooms:", err);
    }
  }, [user]);

  useEffect(() => {
    if (userData?.rooms) {
      loadRooms();
    }
  }, [userData?.rooms, loadRooms]);

  useEffect(() => {
    if (!activeRoomId) return;
    setMessages([]);
    setTypingStatuses({});
    
    const { subscribeToTypingStatus, markMessagesAsSeen } = require("@/firebase/chatService");
    
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
    const { setTypingStatus } = require("@/firebase/chatService");

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
      const { sendMessage, setTypingStatus } = require("@/firebase/chatService");
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
    if (!timestamp) return "Never";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myNickname = userData?.nickname || userData?.username || "Me";
  const activeRoomData = rooms.find(r => r.room_id === activeRoomId);
  const partnerNickname = activeRoomData?.partner?.nickname || activeRoomData?.partner?.username || "Partner";

  return (
    <div className="h-screen flex bg-[#080810] text-white overflow-hidden" onClick={handleDoubleTapExit} style={{ touchAction: 'manipulation' }}>
      
      <aside className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-[#1a1a2e] bg-[#0d0d17] ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        <header className="px-5 py-5 border-b border-[#1a1a2e] flex items-center justify-between sticky top-0 z-10 bg-[#0d0d17]/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-[#1c1c2e] hover:bg-[#27273a] flex items-center justify-center transition">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
          </div>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="w-8 h-8 rounded-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {rooms.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-zinc-400">No active connections.</p>
              <button onClick={handleCreateRoom} disabled={modalLoading} className="mt-4 px-4 py-2 bg-[#1c1c2e] rounded-xl text-xs font-semibold text-white">
                Create New Connection
              </button>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {rooms.map((room) => {
                const isSelected = activeRoomId === room.room_id;
                const pName = room.partner?.nickname || room.partner?.username || "Waiting for partner...";
                return (
                  <button
                    key={room.room_id}
                    onClick={() => setActiveRoomId(room.room_id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl transition flex flex-col gap-1 ${isSelected ? 'bg-indigo-600/10' : 'hover:bg-[#1a1a2e]'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-400' : 'text-zinc-200'}`}>{pName}</span>
                        {room.partner?.isOnline && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500">
                      <span>Room Code: <span className="font-mono text-zinc-400">{room.room_code}</span></span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 bg-[#080810] relative ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
            <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
            <p className="text-sm text-zinc-500 max-w-sm">Select a conversation to start chatting.</p>
          </div>
        ) : (
          <>
            <header className="flex-shrink-0 bg-[#080810]/95 backdrop-blur border-b border-[#1a1a2e] px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveRoomId(null)} className="md:hidden w-8 h-8 rounded-lg bg-[#1c1c2e] flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-base truncate">{partnerNickname}</h2>
                    {activeRoomData?.partner && partnerOnline && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-zinc-500 font-mono tracking-wide">{activeRoomData?.room_code}</p>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-400 italic">
                      {partnerOnline ? "Active now" : `Last seen: ${formatLastSeen(partnerLastActive)}`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => activeRoomId && startCall(activeRoomId)}
                  disabled={isCalling || isCallActive}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-lg ${isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30'}`}
                  title="Start Study Session"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </header>

            <ChatBox>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-1 mt-auto">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.uid;
                  return (
                    <div key={msg.message_id} className="group relative">
                      <MessageBubble
                        text={msg.message_text}
                        senderName={isOwn ? myNickname : partnerNickname}
                        isOwnMessage={isOwn}
                        replyTo={msg.reply_to}
                        status={isOwn ? msg.status : undefined}
                      />
                      <button 
                        onClick={() => setReplyTo({ id: msg.message_id, text: msg.message_text, senderName: isOwn ? myNickname : partnerNickname })}
                        className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-[#1c1c2e] text-zinc-400 ${isOwn ? 'right-[80%]' : 'left-[80%]'}`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {Object.entries(typingStatuses).some(([uid, isTyping]) => uid !== user?.uid && isTyping) && (
                  <div className="flex items-center gap-2 px-2 py-1 animate-pulse">
                    <span className="text-[10px] text-zinc-500 font-medium italic">{partnerNickname} is typing...</span>
                  </div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            </ChatBox>

            <footer className="footer bg-[#0d0d17]/80 backdrop-blur border-t border-[#1a1a2e] px-4 md:px-6 py-4">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
                {replyTo && (
                  <div className="flex items-center justify-between bg-[#151523] border border-[#27273a] rounded-xl px-4 py-2">
                    <div className="flex flex-col min-w-0 border-l-2 border-indigo-500 pl-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Replying to {replyTo.senderName}</span>
                      <p className="text-xs text-zinc-400 truncate">{replyTo.text}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-zinc-500 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    className="flex-1 bg-[#151523] border border-[#27273a] text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button onClick={handleSend} disabled={!text.trim() || sending} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-3xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-5 right-5 text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create / Join Room</h2>
            <div className="space-y-4">
              <button onClick={handleCreateRoom} className="w-full py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium">Generate Code</button>
              <div className="flex gap-2">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="RM-XXXX" className="flex-1 bg-[#0a0a0f] border border-[#27272a] text-white rounded-xl px-4 text-center" />
                <button onClick={handleJoinRoom} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold">Join</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
