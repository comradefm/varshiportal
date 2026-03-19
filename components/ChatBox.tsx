"use client";
import { useEffect, useRef } from "react";

interface ChatBoxProps {
  children: React.ReactNode;
}

export default function ChatBox({ children }: ChatBoxProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
