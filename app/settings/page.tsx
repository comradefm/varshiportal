"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/firebase/authService";

export default function Settings() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (userData.nickname || userData.username || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center gap-4">
        <Link href="/dashboard" id="settings-back" className="w-9 h-9 rounded-xl bg-[#1c1c27] flex items-center justify-center hover:bg-[#27272a] transition">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-semibold text-white">Settings</h1>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Profile Card */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300 flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{userData.nickname || userData.username}</p>
            <p className="text-sm text-zinc-500 truncate">@{userData.username}</p>
            <p className="text-xs text-zinc-600 mt-0.5 truncate">{userData.email}</p>
          </div>
        </div>

        {/* Room Info */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Connection</h2>
          {userData.room_id ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                <span className="text-sm text-zinc-300">Room active</span>
              </div>
              <span className="text-xs font-mono text-zinc-500 bg-[#1c1c27] px-3 py-1 rounded-lg">{userData.room_id.slice(0, 8)}…</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <span className="text-sm text-zinc-500">Not paired yet</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings List */}
        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl overflow-hidden">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 pt-5 pb-3">Preferences</h2>
          <ul>
            {[
              { label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
              { label: "Appearance", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
            ].map((item, i) => (
              <li key={item.label} className={`flex items-center gap-4 px-5 py-4 hover:bg-[#1c1c27] active:bg-[#27272a] cursor-pointer transition ${i > 0 ? "border-t border-[#27272a]" : ""}`}>
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-sm text-zinc-300">{item.label}</span>
                <svg className="w-4 h-4 text-zinc-700 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl overflow-hidden">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 pt-5 pb-3">Info</h2>
          <ul>
            <li>
              <Link href="/about" id="about-link" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1c1c27] active:bg-[#27272a] cursor-pointer transition">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-zinc-300">About StudyPortal</span>
                <svg className="w-4 h-4 text-zinc-700 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          </ul>
        </div>

        {/* Sign Out */}
        <button
          id="signout-btn"
          onClick={handleSignOut}
          className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 rounded-2xl text-red-400 font-medium text-sm transition-all duration-200"
        >
          Sign Out
        </button>

        <p className="text-center text-xs text-zinc-700 pb-4">StudyPortal v1.0.0</p>
      </main>
    </div>
  );
}
