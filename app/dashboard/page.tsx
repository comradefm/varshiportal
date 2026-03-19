"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

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
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#27272a] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight">StudyPortal</span>
        </div>
        <Link href="/settings" id="settings-link" className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 hover:bg-indigo-600/30 transition">
          {initials}
        </Link>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Greeting */}
        <div className="mb-2">
          <p className="text-zinc-500 text-sm">Good day,</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            {userData.nickname || userData.username} 👋
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Courses", value: "4", color: "indigo" },
            { label: "Pending", value: "2", color: "amber" },
            { label: "Done", value: "11", color: "emerald" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#13131a] border border-[#27272a] rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Courses */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Courses</h2>
            <span className="text-xs text-zinc-500">4 enrolled</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Advanced Mathematics", progress: 68, color: "bg-indigo-500" },
              { name: "Physics 101", progress: 45, color: "bg-violet-500" },
              { name: "Chemistry Basics", progress: 82, color: "bg-emerald-500" },
              { name: "English Literature", progress: 30, color: "bg-amber-500" },
            ].map((course) => (
              <div key={course.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-300">{course.name}</span>
                    <span className="text-xs text-zinc-600">{course.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${course.color} rounded-full transition-all duration-700`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Assignments */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Assignments</h2>
            <span className="text-xs text-zinc-500">2 pending</span>
          </div>
          <ul className="space-y-3">
            {[
              { name: "Chapter 4 Quiz", subject: "Mathematics", due: "Due Tomorrow", urgency: "text-red-400" },
              { name: "Lab Report #3", subject: "Physics", due: "Due in 3 days", urgency: "text-amber-400" },
            ].map((a) => (
              <li key={a.name} className="flex items-center justify-between p-3 bg-[#1c1c27] rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{a.subject}</p>
                </div>
                <span className={`text-xs font-medium ${a.urgency}`}>{a.due}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Notes */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Recent Notes</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Integration Formulas", tag: "Math", bg: "bg-indigo-600/10 border-indigo-500/20" },
              { title: "Newton's Laws", tag: "Physics", bg: "bg-violet-600/10 border-violet-500/20" },
              { title: "Periodic Table", tag: "Chemistry", bg: "bg-emerald-600/10 border-emerald-500/20" },
              { title: "Literary Devices", tag: "English", bg: "bg-amber-600/10 border-amber-500/20" },
            ].map((note) => (
              <div key={note.title} className={`${note.bg} border rounded-xl p-3 cursor-pointer hover:brightness-110 transition`}>
                <p className="text-sm font-medium text-white/90 leading-snug">{note.title}</p>
                <p className="text-xs text-white/40 mt-1">{note.tag}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Discussion placeholder */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-3">Discussion</h2>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1c1c27] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-600">No recent discussions.</p>
            <p className="text-xs text-zinc-700 mt-1">Start a new topic to collaborate!</p>
          </div>
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0f]/90 backdrop-blur border-t border-[#27272a] flex items-center justify-around px-4 py-3">
        {[
          { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Home", active: true, href: "/dashboard" },
          { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Courses", active: false, href: "/dashboard" },
          { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Tasks", active: false, href: "/dashboard" },
          { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Settings", active: false, href: "/settings" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 px-3 transition ${item.active ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={item.active ? 2 : 1.5} d={item.icon} />
            </svg>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="h-20" /> {/* bottom nav spacer */}
    </div>
  );
}
