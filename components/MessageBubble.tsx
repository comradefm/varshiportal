"use client";
import React, { useState, useRef } from "react";
import ReactionPicker from "./ReactionPicker";

interface MessageBubbleProps {
  id: string;
  text: string;
  senderName: string;
  isOwnMessage: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  status?: "sent" | "seen";
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";
  duration?: number;
  reactions?: Record<string, string>;
  onReplyClick?: (id: string) => void;
  onReplyTrigger?: () => void;
  onToggleReaction?: (emoji: string) => void;
}

export default function MessageBubble({
  id,
  text,
  senderName,
  isOwnMessage,
  replyTo,
  status,
  mediaUrl,
  mediaType,
  duration,
  reactions = {},
  onReplyClick,
  onReplyTrigger,
  onToggleReaction,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number>(0);
  const touchXRef = useRef<number>(0);
  const touchYRef = useRef<number>(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Double tap handler
  const handleBubbleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // Double tap detected! Quick ❤️ reaction
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      if (onToggleReaction) onToggleReaction("❤️");
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
      }, 300);
    }
  };

  // Long press handler
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = Date.now();
    touchXRef.current = e.touches[0].clientX;
    touchYRef.current = e.touches[0].clientY;
    pressTimerRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pressTimerRef.current) {
      const diffX = Math.abs(e.touches[0].clientX - touchXRef.current);
      const diffY = Math.abs(e.touches[0].clientY - touchYRef.current);
      if (diffX > 10 || diffY > 10) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - touchXRef.current;
    // Swipe right to reply
    if (diffX > 60 && onReplyTrigger) {
      onReplyTrigger();
    }
  };

  const reactionCounts: Record<string, number> = {};
  Object.values(reactions).forEach((emoji) => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });

  return (
    <div
      className={`flex flex-col w-full mb-3 select-none ${isOwnMessage ? "items-end" : "items-start"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span className={`text-[11px] text-zinc-500 mb-1 font-medium ${isOwnMessage ? "mr-2" : "ml-2"}`}>
        {senderName}
      </span>

      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] relative ${isOwnMessage ? "items-end" : "items-start"}`}>
        {/* Emoji Reaction Picker Popover */}
        {showPicker && (
          <ReactionPicker
            isOwnMessage={isOwnMessage}
            onSelectEmoji={(emoji) => onToggleReaction && onToggleReaction(emoji)}
            onClose={() => setShowPicker(false)}
          />
        )}

        {/* Double-tap heart splash animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping">
            <span className="text-4xl">❤️</span>
          </div>
        )}

        <div
          onClick={handleBubbleClick}
          className={`relative px-4 py-2.5 break-words text-sm leading-relaxed shadow-lg flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
            isOwnMessage
              ? "bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 text-white rounded-2xl rounded-tr-sm shadow-rose-950/40"
              : "bg-[#181524] border border-[#2e2640] text-zinc-100 rounded-2xl rounded-tl-sm shadow-black/60"
          }`}
        >
          {/* Reply Context Header */}
          {replyTo && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onReplyClick) onReplyClick(replyTo.id);
              }}
              className={`mb-1.5 px-3 py-1.5 rounded-lg border-l-2 text-[11px] line-clamp-2 cursor-pointer transition-colors ${
                isOwnMessage
                  ? "bg-black/30 border-rose-300 text-zinc-200 hover:bg-black/40"
                  : "bg-white/5 border-rose-500/60 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <div className="font-bold opacity-90 mb-0.5 truncate">{replyTo.senderName}</div>
              <div className="opacity-90 italic truncate">{replyTo.text}</div>
            </div>
          )}

          {/* Media Player / Attachment */}
          {mediaUrl && (
            <div className="my-1 rounded-xl overflow-hidden">
              {mediaType === "image" && (
                <img
                  src={mediaUrl}
                  alt="Attachment"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  className="max-h-60 rounded-xl object-cover hover:scale-105 transition-transform cursor-pointer"
                />
              )}
              {mediaType === "video" && (
                <video src={mediaUrl} controls className="max-h-60 rounded-xl object-cover" />
              )}
              {mediaType === "audio" && (
                <div className="flex items-center gap-2 p-2 bg-black/20 rounded-xl">
                  <audio src={mediaUrl} controls className="h-8 max-w-[200px]" />
                  {duration && <span className="text-[10px] opacity-70">{duration}s</span>}
                </div>
              )}
            </div>
          )}

          {/* Message Text */}
          {text && <div className="whitespace-pre-wrap">{text}</div>}

          {/* Reaction badges */}
          {Object.keys(reactionCounts).length > 0 && (
            <div
              className={`absolute -bottom-2.5 flex items-center gap-1 bg-[#12101d] border border-rose-500/30 rounded-full px-2 py-0.5 text-xs shadow-md ${
                isOwnMessage ? "right-2" : "left-2"
              }`}
            >
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji} className="flex items-center gap-0.5">
                  {emoji} {count > 1 && <span className="text-[10px] font-bold text-rose-300">{count}</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Read Receipt */}
        {isOwnMessage && status && (
          <div className="mt-1 mr-1 flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 font-medium lowercase">
              {status === "seen" ? "Seen" : "Sent"}
            </span>
            {status === "seen" && (
              <svg className="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Images */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img src={mediaUrl} alt="Enlarged media" className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
