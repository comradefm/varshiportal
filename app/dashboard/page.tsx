"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToCourses,
  subscribeToAssignments,
  toggleAssignment,
  deleteAssignment,
  subscribeToNotes,
  addAssignment,
  addNote,
  deleteNote,
  seedDefaultCourses,
  seedCurriculum,
} from "@/firebase/firestoreService";

import { useCall } from "@/context/CallContext";
import WelcomeOverlay from "@/components/WelcomeOverlay";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string;
  name: string;
  progress: number;
  color: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  done: boolean;
}

interface Note {
  id: string;
  title: string;
  subject: string;
  color: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDue(dateStr: string) {
  if (!dateStr) return "";
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Due Tomorrow";
  return `Due in ${diffDays} days`;
}

function dueUrgency(dateStr: string) {
  if (!dateStr) return "text-zinc-500";
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays < 0) return "text-red-500";
  if (diffDays <= 1) return "text-red-400";
  if (diffDays <= 3) return "text-amber-400";
  return "text-emerald-400";
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function AddAssignmentModal({
  courses,
  onClose,
  onAdd,
}: {
  courses: Course[];
  onClose: () => void;
  onAdd: (data: { title: string; subject: string; dueDate: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(courses[0]?.name || "");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setLoading(true);
    await onAdd({ title: title.trim(), subject, dueDate });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#13131a] border border-[#27272a] rounded-t-3xl p-6 space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">Add Assignment</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve HC Verma Ch 29"
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white focus:outline-none focus:border-indigo-500 transition text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white focus:outline-none focus:border-indigo-500 transition text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !title.trim() || !dueDate}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all"
          >
            {loading ? "Adding..." : "Add Assignment"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddNoteModal({
  courses,
  onClose,
  onAdd,
}: {
  courses: Course[];
  onClose: () => void;
  onAdd: (data: { title: string; subject: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(courses[0]?.name || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onAdd({ title: title.trim(), subject });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#13131a] border border-[#27272a] rounded-t-3xl p-6 space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white">Add Note</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Integration Formulas"
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1c1c27] border border-[#27272a] text-white focus:outline-none focus:border-indigo-500 transition text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all"
          >
            {loading ? "Adding..." : "Add Note"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const { isInitialized, initializeMedia } = useCall();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  // ── Guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // ── Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    let initialCoursesDone = false;
    let initialAssignsDone = false;
    let initialNotesDone = false;

    const checkLoading = () => {
      if (initialCoursesDone && initialAssignsDone && initialNotesDone) {
        setDataLoading(false);
      }
    };

    const unsubCourses = subscribeToCourses(user.uid, async (data: any) => {
      setCourses(data as Course[]);
      
      // Seed if empty
      if (!initialCoursesDone && data.length === 0) {
        const subjectsList = userData?.subjects?.length ? userData.subjects : ["Physics", "Chemistry", "Mathematics"];
        await seedDefaultCourses(user.uid, subjectsList);
      }
      initialCoursesDone = true;
      checkLoading();
    });

    const unsubAssigns = subscribeToAssignments(user.uid, (data: any) => {
      setAssignments(data as Assignment[]);
      initialAssignsDone = true;
      checkLoading();
    });

    const unsubNotes = subscribeToNotes(user.uid, (data: any) => {
      setNotes(data as Note[]);
      initialNotesDone = true;
      checkLoading();
    });

    return () => {
      unsubCourses();
      unsubAssigns();
      unsubNotes();
    };
  }, [user, userData?.subjects]);

  // ── Auto Seed Curriculum
  useEffect(() => {
    const seedIfNeeded = async () => {
       if (!dataLoading && user && courses.length > 0 && assignments.length === 0 && notes.length === 0) {
          const target = userData?.examTarget || "JEE Mains";
          const subjects = courses.map((c) => c.name);
          await seedCurriculum(user.uid, target, subjects);
       }
    };
    seedIfNeeded();
  }, [dataLoading, user, courses, assignments.length, notes.length, userData?.examTarget]);

  // ── Handlers
  const handleAddAssignment = async (data: { title: string; subject: string; dueDate: string }) => {
    if (!user) return;
    await addAssignment(user.uid, data);
  };

  const handleToggleAssignment = async (id: string, done: boolean) => {
    if (!user) return;
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !done } : a))
    );
    await toggleAssignment(user.uid, id, done);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!user) return;
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    await deleteAssignment(user.uid, id);
  };

  const handleAddNote = async (data: { title: string; subject: string }) => {
    if (!user) return;
    await addNote(user.uid, data, notes.length);
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await deleteNote(user.uid, id);
  };

  // ── Computed Stats
  const pending = assignments.filter((a) => !a.done).length;
  const done = assignments.filter((a) => a.done).length;

  const initials = (userData?.nickname || userData?.username || "?")
    .slice(0, 2)
    .toUpperCase();

  if (authLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Modals */}
      {showAddAssignment && (
        <AddAssignmentModal
          courses={courses}
          onClose={() => setShowAddAssignment(false)}
          onAdd={handleAddAssignment}
        />
      )}
      {showAddNote && (
        <AddNoteModal
          courses={courses}
          onClose={() => setShowAddNote(false)}
          onAdd={handleAddNote}
        />
      )}

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
          {userData.examTarget && (
            <p className="text-xs text-indigo-400 mt-1 font-medium">🎯 Target: {userData.examTarget}</p>
          )}
        </div>

        {/* Stats row */}
        {dataLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#13131a] border border-[#27272a] rounded-2xl p-4 text-center animate-pulse">
                <div className="h-7 bg-[#1c1c27] rounded w-8 mx-auto mb-2" />
                <div className="h-3 bg-[#1c1c27] rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Courses", value: courses.length, color: "text-indigo-400" },
              { label: "Pending", value: pending, color: "text-amber-400" },
              { label: "Done", value: done, color: "text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#13131a] border border-[#27272a] rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Courses */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Courses</h2>
            <span className="text-xs text-zinc-500">{courses.length} enrolled</span>
          </div>
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-[#1c1c27] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">No courses yet.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4">
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
          )}
        </section>

        {/* Assignments */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Assignments</h2>
            <button
              id="add-assignment-btn"
              onClick={() => setShowAddAssignment(true)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-[#1c1c27] rounded-xl animate-pulse" />)}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-600">No assignments yet.</p>
              <button onClick={() => setShowAddAssignment(true)} className="text-xs text-indigo-400 mt-1 hover:underline">
                Add your first one →
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li key={a.id} className={`flex items-center gap-3 p-3 rounded-xl transition ${a.done ? "bg-[#1a1a24] opacity-60" : "bg-[#1c1c27]"}`}>
                  <button
                    onClick={() => handleToggleAssignment(a.id, a.done)}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                      a.done ? "bg-emerald-500 border-emerald-500" : "border-zinc-600 hover:border-indigo-500"
                    }`}
                  >
                    {a.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${a.done ? "line-through text-zinc-500" : "text-white"}`}>
                      {a.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.subject}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium ${dueUrgency(a.dueDate)}`}>
                      {formatDue(a.dueDate)}
                    </span>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="text-zinc-700 hover:text-red-400 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notes */}
        <section className="bg-[#13131a] border border-[#27272a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Notes</h2>
            <button
              id="add-note-btn"
              onClick={() => setShowAddNote(true)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
          {dataLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-[#1c1c27] rounded-xl animate-pulse" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-600">No notes yet.</p>
              <button onClick={() => setShowAddNote(true)} className="text-xs text-indigo-400 mt-1 hover:underline">
                Add your first note →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`${note.color} border rounded-xl p-3 relative group cursor-pointer hover:brightness-110 transition`}
                >
                  <p className="text-sm font-medium text-white/90 leading-snug pr-5">{note.title}</p>
                  <p className="text-xs text-white/40 mt-1">{note.subject}</p>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
      <div className="h-20" />
    </div>
  );
}
