"use client";
import React from "react";

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  isOwnMessage: boolean;
}

const EMOJIS = ["❤️", "🔥", "💋", "🥺", "😂", "✨", "😍", "🌹"];

export default function ReactionPicker({ onSelectEmoji, onClose, isOwnMessage }: ReactionPickerProps) {
  return (
    <div
      className={`absolute -top-12 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-[#12121c] border border-rose-500/30 rounded-full shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-150 ${
        isOwnMessage ? "right-0" : "left-0"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
          className="text-lg hover:scale-130 active:scale-95 transition-transform p-1 rounded-full hover:bg-white/10"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
