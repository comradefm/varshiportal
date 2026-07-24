import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qinensqllsbrkxlcrnrs.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmVuc3FsbHNicmt4bGNybnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MTQxMDEsImV4cCI6MjEwMDQ5MDEwMX0.ekHZy7g19tI2zTg9_NBGBPxe5KYz7AQdj37rq8mjZD0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
