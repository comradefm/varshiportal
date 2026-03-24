"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { subscribeToUserData, updateUserPresence } from "@/firebase/firestoreService";

interface UserData {
  uid?: string;
  email?: string;
  username?: string;
  nickname?: string;
  room_id?: string;
  pin_hash?: string;
  examTarget?: string;
  subjects?: string[];
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

  // Still keep refreshUserData for manual calls if needed, but it's less critical now
  const refreshUserData = useCallback(async (uid: string) => {
    // This is now mostly handled by the subscription, but we can leave it for fallback
  }, []);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (firebaseUser) {
        unsubUser = subscribeToUserData(firebaseUser.uid, (data: any) => {
          setUserData(data);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

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
