import { supabase } from "./supabaseClient";

export async function signInWithGoogleSupabase() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/chat` : undefined,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error signing out:", error);
}
