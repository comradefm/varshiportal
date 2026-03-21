import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  deleteDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) return userDoc.data();
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

export const createUserData = async (userId, data) => {
  try {
    await setDoc(doc(db, "users", userId), {
      user_id: userId,
      room_id: null,
      created_at: serverTimestamp(),
      ...data,
    });
  } catch (error) {
    console.error("Error creating user data:", error);
    throw error;
  }
};

export const updateUserRoom = async (userId, roomId) => {
  try {
    await updateDoc(doc(db, "users", userId), { room_id: roomId });
  } catch (error) {
    console.error("Error updating user room:", error);
    throw error;
  }
};

export const updateUserNickname = async (userId, nickname) => {
  try {
    await updateDoc(doc(db, "users", userId), { nickname });
  } catch (error) {
    console.error("Error updating user nickname:", error);
    throw error;
  }
};

// ─── Courses ─────────────────────────────────────────────────────────────────

const COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

/** Returns courses subcollection for a user sorted by createdAt */
export const getCourses = async (userId) => {
  try {
    const q = query(
      collection(db, "users", userId, "courses"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
};

export const updateCourseProgress = async (userId, courseId, progress) => {
  try {
    await updateDoc(doc(db, "users", userId, "courses", courseId), {
      progress: Math.max(0, Math.min(100, progress)),
    });
  } catch (error) {
    console.error("Error updating course progress:", error);
    throw error;
  }
};

/** Seeds default JEE/NEET themed courses on first setup */
export const seedDefaultCourses = async (userId, subjects) => {
  try {
    const existing = await getCourses(userId);
    if (existing.length > 0) return; // already seeded

    const subjectMap = {
      Physics: { color: "bg-violet-500", defaultProgress: 15 },
      Chemistry: { color: "bg-emerald-500", defaultProgress: 20 },
      Mathematics: { color: "bg-indigo-500", defaultProgress: 10 },
      Biology: { color: "bg-rose-500", defaultProgress: 18 },
      English: { color: "bg-amber-500", defaultProgress: 30 },
    };

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const meta = subjectMap[subject] || {
        color: COLORS[i % COLORS.length],
        defaultProgress: 10,
      };
      await addDoc(collection(db, "users", userId, "courses"), {
        name: subject,
        progress: meta.defaultProgress,
        color: meta.color,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error seeding courses:", error);
    throw error;
  }
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export const getAssignments = async (userId) => {
  try {
    const q = query(
      collection(db, "users", userId, "assignments"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting assignments:", error);
    throw error;
  }
};

export const addAssignment = async (userId, { title, subject, dueDate }) => {
  try {
    const ref = await addDoc(collection(db, "users", userId, "assignments"), {
      title,
      subject,
      dueDate,
      done: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("Error adding assignment:", error);
    throw error;
  }
};

export const toggleAssignment = async (userId, assignmentId, currentDone) => {
  try {
    await updateDoc(
      doc(db, "users", userId, "assignments", assignmentId),
      { done: !currentDone }
    );
  } catch (error) {
    console.error("Error toggling assignment:", error);
    throw error;
  }
};

export const deleteAssignment = async (userId, assignmentId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "assignments", assignmentId));
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
};

// ─── Notes ───────────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  "bg-indigo-600/10 border-indigo-500/20",
  "bg-violet-600/10 border-violet-500/20",
  "bg-emerald-600/10 border-emerald-500/20",
  "bg-amber-600/10 border-amber-500/20",
  "bg-rose-600/10 border-rose-500/20",
  "bg-cyan-600/10 border-cyan-500/20",
];

export const getNotes = async (userId) => {
  try {
    const q = query(
      collection(db, "users", userId, "notes"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting notes:", error);
    throw error;
  }
};

export const addNote = async (userId, { title, subject }, existingCount) => {
  try {
    const color = NOTE_COLORS[existingCount % NOTE_COLORS.length];
    const ref = await addDoc(collection(db, "users", userId, "notes"), {
      title,
      subject,
      color,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("Error adding note:", error);
    throw error;
  }
};

export const deleteNote = async (userId, noteId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};
