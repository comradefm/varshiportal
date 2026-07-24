"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signInWithGoogleSupabase } from "@/lib/supabaseAuth";
import { getUserData, createUserData } from "@/lib/supabaseService";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  useEffect(() => {
    if (!loading && user) {
      const uid = (user as any).id || (user as any).uid;
      getUserData(uid).then((data) => {
        if (data && data.username) {
          router.replace("/chat");
        } else {
          router.replace("/setup");
        }
      }).catch((err) => {
        console.error("Error fetching user profile:", err);
        router.replace("/chat");
      });
    }
  }, [user, loading, router]);

  const handleInstantEntrance = async () => {
    if (!nicknameInput.trim()) {
      setErrorMessage("Please enter a nickname or name to enter!");
      return;
    }
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      // 1. Try Supabase Anonymous Sign-In
      const { data, error } = await supabase.auth.signInAnonymously();
      let uid = data?.user?.id;

      // Fallback local secret ID if anon auth is disabled in dashboard
      if (error || !uid) {
        let storedId = localStorage.getItem("varshi_secret_uid");
        if (!storedId) {
          storedId = "usr_" + Math.random().toString(36).substring(2, 10);
          localStorage.setItem("varshi_secret_uid", storedId);
        }
        uid = storedId;
      }

      // 2. Create user profile in Supabase Database
      const nickname = nicknameInput.trim();
      await createUserData(uid, {
        username: nickname.toLowerCase().replace(/\s+/g, "_"),
        nickname: nickname,
        isOnline: true,
      });

      // Redirect straight to Secret Chat
      router.replace("/chat");
    } catch (err: any) {
      console.error("Instant login failed:", err);
      setErrorMessage(err?.message || "Failed to enter. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      await signInWithGoogleSupabase();
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setErrorMessage(err?.message || "Google Sign-in failed. Please use Instant Entrance below!");
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070b]">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07070b] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/30 mb-4 shadow-xl">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent">Secret Space 🌹</h1>
          <p className="text-zinc-400 mt-2 text-sm">Made with Luv</p>
        </div>

        {/* Card */}
        <div className="bg-[#110e1a] border border-rose-500/20 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white mb-1">Enter Secret Space</h2>
          <p className="text-xs text-zinc-400 mb-6">Type your nickname to enter instantly</p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Instant Entrance Form */}
          <div className="flex flex-col gap-3 mb-6">
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="Enter your nickname (e.g. Varshi) 💕"
              onKeyDown={(e) => e.key === "Enter" && handleInstantEntrance()}
              className="w-full bg-[#181427] border border-rose-500/30 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition placeholder-zinc-500"
            />
            <button
              onClick={handleInstantEntrance}
              disabled={isLoggingIn || !nicknameInput.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-700 to-pink-600 hover:brightness-110 active:scale-95 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-rose-950/50 disabled:opacity-50"
            >
              {isLoggingIn ? "Entering Secret Space..." : "Enter Secret Space 💖"}
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-rose-950/60" />
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">or sign in with</span>
            <div className="flex-1 h-px bg-rose-950/60" />
          </div>

          {/* Google Sign-In Option */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/10 rounded-xl font-medium text-xs transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[10px] text-zinc-600 mt-5">
            Private & Protected Space
          </p>
        </div>
      </div>
    </main>
  );
}
