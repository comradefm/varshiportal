"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { getUserData, updateUserPresence } from "@/firebase/firestoreService";

interface UserData {
  uid?: string;
  email?: string;
  username?: string;
  nickname?: string;
  room_id?: string;
  pin_hash?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async (uid: string) => {
    if (!uid) {
      setUserData(null);
      return;
    }
    try {
      const data = await getUserData(uid);
      setUserData(data);
    } catch (e) {
      console.error("Failed to refresh user data:", e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [refreshUserData]);

  // Presence Tracking
  useEffect(() => {
    if (!user) return;
    updateUserPresence(user.uid, true);

    const handleVisibility = () => {
      updateUserPresence(user.uid, document.visibilityState === "visible");
    };
    const handleUnload = () => {
      updateUserPresence(user.uid, false);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      updateUserPresence(user.uid, false);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
