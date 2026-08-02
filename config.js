// ── Contest configuration ─────────────────────────────────────────────────
// Paste your Supabase project values here to switch ON accounts + leaderboard.
// Leave them empty ("") to keep the app in single-user (local) mode.
// The anon key is a PUBLIC key — safe to commit. Your data is protected by
// Row-Level Security (see supabase-setup.sql). This file is loaded by index.html,
// so updating the app later = just replace index.html; your keys stay here.
window.SRMP_CONFIG = {
  url:  "",   // e.g. "https://abcdefgh.supabase.co"   (Supabase → Settings → API → Project URL)
  anon: ""    // your project's anon / public key       (Supabase → Settings → API → anon public)
};
