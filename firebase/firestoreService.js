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
  onSnapshot,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

// ─── User ────────────────────────────────────────────────────────────────────

export const subscribeToUserData = (userId, callback) => {
  return onSnapshot(doc(db, "users", userId), (doc) => {
    if (doc.exists()) callback(doc.data());
    else callback(null);
  });
};

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
      rooms: [],
      created_at: serverTimestamp(),
      ...data,
    });
  } catch (error) {
    console.error("Error creating user data:", error);
    throw error;
  }
};

export const joinUserToRoom = async (userId, roomId) => {
  try {
    await updateDoc(doc(db, "users", userId), { rooms: arrayUnion(roomId) });
  } catch (error) {
    console.error("Error joining user to room:", error);
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

export const updateUserExamTarget = async (userId, examTarget) => {
  try {
    await updateDoc(doc(db, "users", userId), { examTarget });
  } catch (error) {
    console.error("Error updating exam target:", error);
    throw error;
  }
};

export const updateAlwaysOnVideo = async (userId, enabled) => {
  try {
    await updateDoc(doc(db, "users", userId), { alwaysOnVideo: enabled });
  } catch (error) {
    console.error("Error updating always-on video preference:", error);
    throw error;
  }
};

export const updateUserPresence = async (userId, isOnline) => {
  try {
    // Use setDoc with merge: true to avoid "No document to update" error if user doc is missing
    await setDoc(doc(db, "users", userId), { 
      isOnline, 
      lastActive: serverTimestamp() 
    }, { merge: true });
  } catch (error) {
    console.error("Error updating presence:", error);
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

/** Real-time subscription for courses */
export const subscribeToCourses = (userId, callback) => {
  const q = query(
    collection(db, "users", userId, "courses"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

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

/** Real-time subscription for assignments */
export const subscribeToAssignments = (userId, callback) => {
  const q = query(
    collection(db, "users", userId, "assignments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

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

/** Real-time subscription for notes */
export const subscribeToNotes = (userId, callback) => {
  const q = query(
    collection(db, "users", userId, "notes"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

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

// ─── Curriculum Seeding ──────────────────────────────────────────────────────

const CURRICULUM_DATA = {
  "JEE Mains": {
    Physics: {
      notes: ["Kinematics Formulas", "Laws of Motion FBDs", "Thermodynamics Core Concepts"],
      assignments: [
        { title: "Solve HC Verma Ch 2-5", dueDays: 2 },
        { title: "PYQs on Rotational Mechanics", dueDays: 4 }
      ]
    },
    Chemistry: {
      notes: ["Organic Name Reactions", "Inorganic Exception Trends", "Physical Chemistry Formula Sheet"],
      assignments: [
        { title: "NCERT Exemplar: Chemical Bonding", dueDays: 3 },
        { title: "Coordination Compounds Mock Test", dueDays: 5 }
      ]
    },
    Mathematics: {
      notes: ["Calculus Short Tricks", "Coordinate Geometry Key Points", "Algebra Cheat Sheet"],
      assignments: [
        { title: "Solve RD Sharma: Integration", dueDays: 2 },
        { title: "PYQs: Vector & 3D Geometry", dueDays: 6 }
      ]
    }
  },
  "JEE Advanced": {
    Physics: {
      notes: ["Advanced Mechanics Concepts", "Electrodynamics In-Depth", "Optics Derivations"],
      assignments: [
        { title: "Irodov Selected Problems", dueDays: 3 },
        { title: "JEE Advanced PYQs: Path Finder", dueDays: 7 }
      ]
    },
    Chemistry: {
      notes: ["Advanced Reaction Mechanisms", "Block Chemistry Details", "Thermodynamics & Equilibrium"],
      assignments: [
        { title: "MS Chouhan Organic Set 1", dueDays: 4 },
        { title: "N Avasthi Physical Chem Problems", dueDays: 5 }
      ]
    },
    Mathematics: {
      notes: ["Complex Numbers Properties", "Integral Calculus Tricks", "Conic Sections Master Sheet"],
      assignments: [
        { title: "Black Book: Calculus", dueDays: 5 },
        { title: "Advanced Mock Test", dueDays: 7 }
      ]
    }
  },
  "NEET": {
    Physics: {
      notes: ["NEET Formula Sheet", "Important Graphs & Charts", "Modern Physics Summary"],
      assignments: [
        { title: "Solve PYQs: Mechanics", dueDays: 2 },
        { title: "Mock Test: Optics", dueDays: 4 }
      ]
    },
    "Physical Chemistry": {
      notes: ["Thermodynamics Formulas", "Electrochemistry: Nernst Equation", "Chemical Kinetics Rate Equations"],
      assignments: [
        { title: "Solve 50 Numericals: Equilibrium & pH", dueDays: 2 },
        { title: "PYQs: Electrochemistry", dueDays: 4 }
      ]
    },
    "Organic Chemistry": {
      notes: ["GOC: Inductive & Resonance", "Named Reactions Cheat Sheet", "Biomolecules & Polymers Revision"],
      assignments: [
        { title: "Solve 50+ MCQs on Hydrocarbons", dueDays: 3 },
        { title: "Reaction Mechanisms Practice Sheet", dueDays: 5 }
      ]
    },
    "Inorganic Chemistry": {
      notes: ["Chemical Bonding: VSEPR & MOT", "Coordination Compounds Isomerism", "p-Block Exceptions & Trends"],
      assignments: [
        { title: "NCERT Reading: Coordination Compounds", dueDays: 2 },
        { title: "PYQs: Chemical Bonding", dueDays: 6 }
      ]
    },
    Biology: {
      notes: ["Human Physiology Flowcharts", "Genetics Core Concepts", "Plant Kingdom Examples"],
      assignments: [
        { title: "NCERT Reading: Ecology", dueDays: 2 },
        { title: "Solve 100+ MCQs: Cell Biology", dueDays: 4 }
      ]
    }
  },
  "Boards": {
    Physics: {
      notes: ["Class 12 Derivations", "Important Definitions", "Ray Optics Ray Diagrams"],
      assignments: [
        { title: "Previous Year Board Paper 2023", dueDays: 4 }
      ]
    },
    Chemistry: {
      notes: ["Organic Conversions Map", "P-Block Elements Summary", "Electrochemistry Formulas"],
      assignments: [
        { title: "Sample Paper: Chemistry", dueDays: 5 }
      ]
    },
    Mathematics: {
      notes: ["Calculus NCERT Summary", "Vectors & 3D Important Forms"],
      assignments: [
        { title: "NCERT Miscellaneous Exercises", dueDays: 3 }
      ]
    },
    English: {
      notes: ["Writing Section Formats", "Literature Chapter Summaries", "Vistas Important Characters"],
      assignments: [
        { title: "Write Article on given topic", dueDays: 2 },
        { title: "Pre-board Mock Test", dueDays: 6 }
      ]
    }
  }
};

export const seedCurriculum = async (userId, examTarget, subjects) => {
  try {
    const curriculum = CURRICULUM_DATA[examTarget];
    if (!curriculum) return;

    let noteCount = 0;

    for (const subject of subjects) {
      const data = curriculum[subject];
      if (data) {
        for (const noteTitle of data.notes) {
          await addNote(userId, { title: noteTitle, subject }, noteCount);
          noteCount++;
        }
        
        for (const assign of data.assignments) {
          const due = new Date();
          due.setDate(due.getDate() + assign.dueDays);
          const dueDate = due.toISOString().split('T')[0];
          await addAssignment(userId, { title: assign.title, subject, dueDate });
        }
      }
    }
  } catch (error) {
    console.error("Error seeding curriculum:", error);
    throw error;
  }
};
// ─── Rooms ───────────────────────────────────────────────────────────────────

export const leaveRoom = async (userId, roomId) => {
  try {
    // 1. Remove from user's rooms array
    await updateDoc(doc(db, "users", userId), {
      rooms: arrayRemove(roomId)
    });

    // 2. Check if room is empty (optional but good)
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      const data = roomSnap.data();
      // If the another user is also gone or was never there, we could delete it.
      // For now, just unlinking is fine to keep history if needed.
    }
  } catch (error) {
    console.error("Error leaving room:", error);
    throw error;
  }
};
