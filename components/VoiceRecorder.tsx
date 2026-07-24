"use client";
import React, { useState, useRef } from "react";

interface VoiceRecorderProps {
  onSendVoice: (audioBase64: string, durationSec: number) => Promise<void>;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = ["audio/webm", "audio/mp4", "audio/aac", "audio/ogg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      onCancel();
    }
  };

  React.useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    setUploading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentRecorder = mediaRecorderRef.current;
    currentRecorder.onstop = async () => {
      const mimeType = getSupportedMimeType() || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await onSendVoice(base64Audio, seconds);
        setUploading(false);
      };
    };

    if (currentRecorder.state !== "inactive") {
      currentRecorder.stop();
      currentRecorder.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#161320] border border-rose-500/30 rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
      <span className="text-xs font-mono text-rose-300 font-bold tracking-wider">{formatTime(seconds)}</span>
      <div className="flex-1 h-1.5 bg-rose-950 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse w-full" />
      </div>
      <button
        onClick={handleCancel}
        disabled={uploading}
        className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg transition"
      >
        Cancel
      </button>
      <button
        onClick={stopAndSend}
        disabled={uploading}
        className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition"
      >
        {uploading ? "Sending..." : "Send Voice 🌹"}
      </button>
    </div>
  );
}
