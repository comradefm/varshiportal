"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createUserData } from "@/firebase/firestoreService";
import { hashPin } from "@/lib/pinUtils";

export default function Setup() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) return setError("Username is required.");
    if (!nickname.trim()) return setError("Nickname is required.");
    if (!/^\d{4}$/.test(pin)) return setError("PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return setError("PINs do not match.");
    if (!user) return setError("Not authenticated. Please sign in again.");

    setLoading(true);
    try {
      const pin_hash = await hashPin(pin);
      await createUserData(user.uid, {
        email: user.email,
        username: username.trim().toLowerCase(),
        nickname: nickname.trim(),
        pin_hash,
      });
      await refreshUserData(user.uid);
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 mb-3">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Profile</h1>
          <p className="text-zinc-500 text-sm mt-1">Just a few details to get started</p>
        </div>

        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ksathwikchandra"
                className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                autoComplete="off"
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Chat Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Star, Moon, etc."
                className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                autoComplete="off"
              />
              <p className="text-xs text-zinc-600 mt-1">This name appears in your chat conversations.</p>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                PIN Code (4 digits)
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm tracking-widest text-center"
              />
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Confirm PIN
              </label>
              <input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm tracking-widest text-center"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              id="setup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                "Complete Setup →"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
