"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createUserData } from "@/firebase/firestoreService";
import { seedDefaultCourses } from "@/firebase/firestoreService";
import { hashPin } from "@/lib/pinUtils";

const EXAM_SUBJECTS: Record<string, string[]> = {
  "JEE Mains": ["Physics", "Chemistry", "Mathematics"],
  "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
  "NEET": ["Physics", "Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry", "Biology"],
  "Boards": ["Physics", "Chemistry", "Mathematics", "English"],
};

const ALL_EXAMS = Object.keys(EXAM_SUBJECTS);

export default function Setup() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();

  // Step 1 fields
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Step 2 fields
  const [step, setStep] = useState(1);
  const [examTarget, setExamTarget] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1 validations
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) return setError("Username is required.");
    if (!nickname.trim()) return setError("Nickname is required.");
    if (!/^\d{4}$/.test(pin)) return setError("PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return setError("PINs do not match.");
    setStep(2);
  };

  // ── Exam selected → pre-fill subjects
  const selectExam = (exam: string) => {
    setExamTarget(exam);
    setSubjects(EXAM_SUBJECTS[exam] || []);
  };

  const toggleSubject = (sub: string) => {
    setSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // ── Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!examTarget) return setError("Please select your target exam.");
    if (subjects.length === 0) return setError("Please select at least one subject.");
    if (!user) return setError("Not authenticated. Please sign in again.");

    setLoading(true);
    try {
      const pin_hash = await hashPin(pin);
      await createUserData(user.uid, {
        email: user.email,
        username: username.trim().toLowerCase(),
        nickname: nickname.trim(),
        pin_hash,
        examTarget,
        subjects,
      });
      await seedDefaultCourses(user.uid, subjects);
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 mb-3">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? "Set Up Your Profile" : "Your Study Target"}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {step === 1 ? "Step 1 of 2 — Basic details" : "Step 2 of 2 — Choose your exam"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${step >= s ? "bg-indigo-500" : "bg-[#27272a]"}`}
            />
          ))}
        </div>

        <div className="bg-[#13131a] border border-[#27272a] rounded-2xl p-8 shadow-2xl">

          {/* ─── Step 1 ──────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
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

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Chat Nickname</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Star, Moon, etc."
                  className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-600 mt-1">Appears in chat conversations.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">PIN Code (4 digits)</label>
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

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Confirm PIN</label>
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
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
              )}

              <button
                id="step1-next-btn"
                type="submit"
                className="w-full mt-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all duration-200"
              >
                Next →
              </button>
            </form>
          )}

          {/* ─── Step 2 ──────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Exam selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Target Exam</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_EXAMS.map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => selectExam(exam)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                        examTarget === exam
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-[#1c1c27] border-[#27272a] text-zinc-400 hover:border-indigo-500/50"
                      }`}
                    >
                      {exam}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject toggles */}
              {examTarget && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {EXAM_SUBJECTS[examTarget].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`py-1.5 px-4 rounded-full border text-sm font-medium transition-all ${
                          subjects.includes(sub)
                            ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                            : "bg-[#1c1c27] border-[#27272a] text-zinc-500 hover:border-zinc-500"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-2">Tap to toggle. These become your courses.</p>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 py-3 bg-[#1c1c27] border border-[#27272a] text-zinc-400 rounded-xl font-semibold text-sm hover:border-zinc-500 transition-all"
                >
                  ← Back
                </button>
                <button
                  id="setup-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Let's Go 🚀"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
