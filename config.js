// ── Contest configuration ─────────────────────────────────────────────────
// Paste your Supabase project values here to switch ON accounts + leaderboard.
// Leave them empty ("") to keep the app in single-user (local) mode.
// The anon key is a PUBLIC key — safe to commit. Your data is protected by
// Row-Level Security (see supabase-setup.sql). This file is loaded by index.html,
// so updating the app later = just replace index.html; your keys stay here.
window.SRMP_CONFIG = {
  url:  "https://vnzwswouwlhhcoewsaex.supabase.co",   // e.g. "https://abcdefgh.supabase.co"   (Supabase → Settings → API → Project URL)
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuendzd291d2xoaGNvZXdzYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1ODcxMTIsImV4cCI6MjEwMTE2MzExMn0.-WZNB9tKgDlBFkwKPaUc5OqbJRTwh14gYg52_LHAaBc"    // your project's anon / public key       (Supabase → Settings → API → anon public)
};
