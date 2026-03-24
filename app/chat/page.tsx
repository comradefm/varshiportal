"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, subscribeToMessages } from "@/firebase/chatService";
import { getRoomData, getPartnerData, getUserRooms, createRoom, joinRoom } from "@/firebase/roomService";
import { db } from "@/firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
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

  const lastClickTimeRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDoubleTapExit = (e: React.MouseEvent) => {
    // Don't exit if tapping on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea')) return;
    
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTimeRef.current;
    
    // Using 800ms for mobile reliability
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
      return;
    }
    const room = rooms.find(r => r.room_id === activeRoomId);
    if (!room?.partner?.uid) {
      setPartnerOnline(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", room.partner.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartnerOnline(!!data.isOnline);
      } else {
        setPartnerOnline(false);
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

  // Initial rooms load & refresh when user's rooms array changes
  useEffect(() => {
    if (userData?.rooms) {
      loadRooms();
    }
  }, [userData?.rooms, loadRooms]);

  // Subscribe to messages and typing status when active room changes
  useEffect(() => {
    if (!activeRoomId) return;
    setMessages([]); // clear old messages instantly
    setTypingStatuses({});
    
    const { subscribeToTypingStatus, markMessagesAsSeen } = require("@/firebase/chatService");
    
    const unsubMessages = subscribeToMessages(activeRoomId, (msgs: any[]) => {
      setMessages(msgs);
      // When new messages arrive, mark them as seen if we are in the room
      if (user) markMessagesAsSeen(activeRoomId, user.uid);
    });
    
    const unsubTyping = subscribeToTypingStatus(activeRoomId, setTypingStatuses);
    
    // Initial mark as seen
    if (user) markMessagesAsSeen(activeRoomId, user.uid);

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [activeRoomId, user]);

  // Handle typing status updates
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

  // Auto-scroll on new messages
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
      setText(msg); // restore text on failure
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
      // Wait for refresh to trigger loadRooms automatically
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
      
      {/* SIDEBAR (Left Pane) */}
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
            title="Create or Join Connection"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          {rooms.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">No active connections.</p>
              <button 
                onClick={handleCreateRoom}
                disabled={modalLoading}
                className="mt-4 px-4 py-2 bg-[#1c1c2e] hover:bg-[#27273a] rounded-xl text-xs font-semibold text-white transition"
              >
                Create New Connection
              </button>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {rooms.map((room) => {
                const isSelected = activeRoomId === room.room_id;
                const pName = room.partner?.nickname || room.partner?.username || "Waiting for partner...";
                const isWaiting = !room.partner;

                return (
                  <button
                    key={room.room_id}
                    onClick={() => setActiveRoomId(room.room_id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl transition flex flex-col gap-1 ${
                      isSelected ? 'bg-indigo-600/10 hover:bg-indigo-600/15' : 'hover:bg-[#1a1a2e]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-400' : 'text-zinc-200'}`}>
                          {pName}
                        </span>
                        {room.partner?.isOnline && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 flex-shrink-0" title="Online" />}
                      </div>
                      {isWaiting && (
                         <span className="text-[10px] uppercase font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                           Pending
                         </span>
                      )}
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

      {/* MAIN PANEL (Right Pane) */}
      <main className={`flex-1 flex flex-col min-w-0 bg-[#080810] relative ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        {!activeRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
            <div className="w-20 h-20 border border-zinc-800 rounded-full flex items-center justify-center mb-6 relative shadow-xl shadow-black">
               <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
            <p className="text-sm text-zinc-500 max-w-sm">Select a conversation from the sidebar or start a new connection to message your study partners privately.</p>
          </div>
        ) : (
          <>
            <header className="flex-shrink-0 bg-[#080810]/95 backdrop-blur border-b border-[#1a1a2e] px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveRoomId(null)}
                  className="md:hidden w-8 h-8 rounded-lg bg-[#1c1c2e] flex items-center justify-center hover:bg-[#27273a] transition"
                >
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-base truncate">{partnerNickname}</h2>
                    {activeRoomData?.partner && partnerOnline && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Online now" />}
                  </div>
                  <p className="text-xs text-zinc-500 font-mono tracking-wide mt-0.5">{activeRoomData?.room_code}</p>
                </div>
              </div>
            </header>

            <ChatBox>
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-1">
                {!activeRoomData?.partner ? (
                   <div className="flex flex-col items-center justify-center h-full pt-10 text-center px-4">
                     <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                       <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                     </div>
                     <h3 className="text-white font-bold mb-1">Waiting for partner</h3>
                     <p className="text-sm text-zinc-500">Share code <span className="font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">{activeRoomData?.room_code}</span> with them.</p>
                   </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full pt-20 text-center px-4">
                    <p className="text-sm text-zinc-600">No messages yet.</p>
                    <p className="text-xs text-zinc-700 mt-1">Say hello to {partnerNickname}! 👋</p>
                  </div>
                ) : null}

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
                        className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-[#1c1c2e] hover:bg-[#27273a] text-zinc-400 ${isOwn ? 'right-[80%]' : 'left-[80%]'}`}
                        title="Reply"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {Object.entries(typingStatuses).some(([uid, isTyping]) => uid !== user?.uid && isTyping) && (
                  <div className="flex items-center gap-2 px-2 py-1 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium italic">
                      {partnerNickname} is typing...
                    </span>
                  </div>
                )}
                
                <div ref={bottomRef} className="h-4" />
              </div>
            </ChatBox>

            {/* Input Footer */}
            <footer className="flex-shrink-0 bg-[#0d0d17]/80 backdrop-blur border-t border-[#1a1a2e] px-4 md:px-6 py-4 w-full">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
                {/* Reply Preview */}
                {replyTo && (
                  <div className="flex items-center justify-between bg-[#151523] border border-[#27273a] rounded-xl px-4 py-2 animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col min-w-0 border-l-2 border-indigo-500 pl-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Replying to {replyTo.senderName}</span>
                      <p className="text-xs text-zinc-400 truncate">{replyTo.text}</p>
                    </div>
                    <button 
                      onClick={() => setReplyTo(null)}
                      className="text-zinc-500 hover:text-zinc-300 transition p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 w-full">
                  <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!activeRoomData?.partner ? "Waiting for partner..." : "Type a message…"}
                    disabled={!activeRoomData?.partner}
                    className="flex-1 min-w-0 bg-[#151523] border border-[#27273a] text-white placeholder-zinc-600 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-[#1a1a2e] transition disabled:opacity-50"
                    autoComplete="off"
                  />
                  <button
                    id="send-btn"
                    onClick={handleSend}
                    disabled={!text.trim() || sending || !activeRoomData?.partner}
                    className="w-12 h-12 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-full flex items-center justify-center transition shadow-lg shadow-indigo-500/20"
                  >
                    <svg className="w-5 h-5 text-white ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* JOIN CONNECTION MODAL / OVERLAY */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-0 animate-fade-in">
          <div className="bg-[#0f0f18] border border-[#1a1a2e] rounded-3xl w-full max-w-md p-6 lg:p-8 flex flex-col gap-6 relative shadow-2xl">
            <button 
              onClick={() => { setShowJoinModal(false); setModalError(""); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1c1c2e] hover:bg-[#27273a] flex items-center justify-center text-zinc-400 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white">Create / Join Room</h2>

            {modalError && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {modalError}
              </div>
            )}

            <div className="bg-[#151523] border border-[#27273a] rounded-2xl p-5">
              <h3 className="font-semibold text-white text-sm mb-1">Create Connection</h3>
              <p className="text-xs text-zinc-500 mb-4">Generate a secure room code to share.</p>
              <button
                onClick={handleCreateRoom}
                disabled={modalLoading}
                className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 disabled:opacity-50 rounded-xl font-medium text-sm transition"
              >
                + Generate Code
              </button>
            </div>

            <div className="flex items-center gap-4 px-2">
              <div className="flex-1 h-px bg-[#27273a]" />
              <span className="text-[10px] uppercase font-bold text-zinc-600">OR JOIN EXISTING</span>
              <div className="flex-1 h-px bg-[#27273a]" />
            </div>

            <div className="bg-[#151523] border border-[#27273a] rounded-2xl p-5">
              <h3 className="font-semibold text-white text-sm mb-1">Join Connection</h3>
              <p className="text-xs text-zinc-500 mb-4">Enter a partner's room code to connect.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="RM-XXXX"
                  maxLength={7}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0a0a0f] border border-[#27273a] text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition text-sm font-mono tracking-widest text-center uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition"
                >
                  Join
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
