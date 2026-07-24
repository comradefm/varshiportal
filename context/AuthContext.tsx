"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserData, updateUserPresence } from "@/lib/supabaseService";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { subscribeToUserData } from "@/firebase/firestoreService";

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
  user: any;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async (uid: string) => {
    try {
      const data = await getUserData(uid);
      if (data) setUserData(data);
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  }, []);

  useEffect(() => {
    let unsubFirebase: (() => void) | null = null;
    let unsubFirestoreDoc: (() => void) | null = null;

    // 1. Supabase Auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const sbUser = {
          uid: session.user.id,
          id: session.user.id,
          email: session.user.email,
        };
        setUser(sbUser);
        const profile = await getUserData(session.user.id);
        setUserData(profile || { uid: session.user.id, email: session.user.email, username: session.user.email?.split("@")[0] });
        setLoading(false);
      } else {
        // Fallback to Firebase Auth
        unsubFirebase = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser) {
            const mappedUser = { uid: fbUser.uid, id: fbUser.uid, email: fbUser.email };
            setUser(mappedUser);
            unsubFirestoreDoc = subscribeToUserData(fbUser.uid, (data: any) => {
              setUserData(data);
              setLoading(false);
            });
          } else {
            setUser(null);
            setUserData(null);
            setLoading(false);
          }
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
      if (unsubFirebase) unsubFirebase();
      if (unsubFirestoreDoc) unsubFirestoreDoc();
    };
  }, []);

  // Presence Tracking
  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid || user.id;
    if (!currentUid) return;

    const update = (online: boolean) => {
      updateUserPresence(currentUid, online);
    };

    update(true);

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") {
        update(true);
      }
    }, 120000);

    const handleVisibility = () => update(document.visibilityState === "visible");
    const handleUnload = () => update(false);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      update(false);
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
