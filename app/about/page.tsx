"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PinUnlock from "@/components/PinUnlock";

export default function About() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const handleHiddenTrigger = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Reset click count after 3 seconds of inactivity
    if (clickTimer) clearTimeout(clickTimer);
    const timer = setTimeout(() => setClickCount(0), 3000);
    setClickTimer(timer);

    if (newCount >= 2) {
      setClickCount(0);
      if (clickTimer) clearTimeout(clickTimer);
      setShowPin(true);
    }
  };

  const handleUnlock = () => {
    setShowPin(false);
    router.push("/chat");
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {showPin && (
        <PinUnlock
          storedHash={(userData as any)?.pin_hash}
          onUnlock={handleUnlock}
          onClose={() => setShowPin(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center gap-4">
        <Link href="/settings" className="w-9 h-9 rounded-xl bg-[#1c1c27] flex items-center justify-center hover:bg-[#27272a] transition">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-semibold text-white">About StudyPortal</h1>
      </header>

      <main className="px-5 py-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* App icon */}
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">StudyPortal</h2>
          <p className="text-zinc-500 text-sm mt-1">Version 1.0.0</p>
        </div>

        {/* Description */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            StudyPortal is a comprehensive tool designed to help students organize their coursework, track assignments, collaborate on notes, and stay ahead of their academic goals.
          </p>
        </div>

        {/* Features */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Features</h3>
          {[
            { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Course tracking with progress indicators" },
            { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Assignment management & due dates" },
            { icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", label: "Notes & study material organisation" },
            { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Secure private study space" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Hidden trigger */}
        <div className="text-center pt-4 pb-12">
          <p
            id="hidden-trigger"
            onClick={handleHiddenTrigger}
            className="text-xs text-zinc-700 select-none cursor-default"
          >
            © 2026 StudyPortal Inc. All rights reserved.
          </p>
          <p className="text-xs text-zinc-800 mt-1">Made with ♥ for students</p>
        </div>
      </main>
    </div>
  );
}
