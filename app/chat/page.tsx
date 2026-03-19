"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, subscribeToMessages } from "@/firebase/chatService";
import { getRoomData, getPartnerData } from "@/firebase/roomService";
import ChatBox from "@/components/ChatBox";
import MessageBubble from "@/components/MessageBubble";

export default function Chat() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [partnerData, setPartnerData] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Redirect if no room
  useEffect(() => {
    if (!loading && userData && !userData.room_id) {
      router.replace("/pairing");
    }
  }, [userData, loading, router]);

  // Load partner data
  useEffect(() => {
    if (userData?.room_id && user?.uid) {
      getPartnerData(userData.room_id, user.uid).then(setPartnerData);
    }
  }, [userData, user]);

  // Subscribe to messages
  useEffect(() => {
    if (!userData?.room_id) return;
    const unsubscribe = subscribeToMessages(userData.room_id, setMessages);
    return () => unsubscribe();
  }, [userData?.room_id]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Double-click to exit
  const handleDoubleClick = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleSend = async () => {
    if (!text.trim() || !user || !userData?.room_id || sending) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    try {
      await sendMessage(userData.room_id, user.uid, msg);
    } catch (err) {
      console.error("Send failed:", err);
      setText(msg); // restore text on failure
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

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myNickname = userData.nickname || userData.username || "Me";
  const partnerNickname = partnerData?.nickname || partnerData?.username || "Partner";

  return (
    <div
      className="h-screen flex flex-col bg-[#080810] text-white select-none overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-[#0d0d17]/90 backdrop-blur border-b border-[#1a1a2e] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Private Thread</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-semibold text-white text-sm">{myNickname} · {partnerNickname}</p>
            {partnerData && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-700 font-mono">{userData.room_id?.slice(-6)}</p>
          <p className="text-[10px] text-zinc-700 mt-0.5">Double-tap to exit</p>
        </div>
      </header>

      {/* Messages */}
      <ChatBox>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-600">No messages yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Say hello to {partnerNickname}! 👋</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === user?.uid;
            return (
              <MessageBubble
                key={msg.message_id}
                text={msg.message_text}
                senderName={isOwn ? myNickname : partnerNickname}
                isOwnMessage={isOwn}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ChatBox>

      {/* Input */}
      <footer
        className="flex-shrink-0 bg-[#0d0d17]/90 backdrop-blur border-t border-[#1a1a2e] px-4 py-4"
        onDoubleClick={(e) => e.stopPropagation()} // prevent double-click exit on input area
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 bg-[#1c1c2e] border border-[#27273a] text-white placeholder-zinc-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            autoComplete="off"
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-11 h-11 flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 rounded-full flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
