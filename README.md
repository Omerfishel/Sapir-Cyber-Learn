# Sapir Cyber Learn — hosted roadmap, always-on reminders, and a contest

A single-page learning tracker for the 2026 cyber-research curriculum, hosted on
**GitHub Pages**, with **email reminders** (via GitHub Actions, so they fire even
when nobody's on the page) and an optional **multi-user contest** (sign-up /
sign-in + a shared leaderboard) powered by **Supabase**.

Files:
- `index.html` — the app (this is the only file that changes between versions).
- `config.js` — your Supabase keys (you edit this once; it survives app updates).
- `supabase-setup.sql` — run once to create the contest tables.
- `.github/workflows/reminders.yml` + `scripts/reminder.mjs` — the daily email cron.

---
## 1. Host it (GitHub Pages)
1. Put all these files in a GitHub repo (keep the folder structure).
2. **Settings → Pages** → Deploy from a branch → `main` / `/ (root)` → Save.
3. Live at `https://<user>.github.io/<repo>/`. Progress saves per-device in the
   browser; when the contest is on, it also syncs to each user's account.

## 2. Email reminders (EmailJS + GitHub Actions)
Create an EmailJS account, add a Gmail **Service**, and a **Template** with:
- **To Email:** `{{to_email}}` · **Subject:** `{{subject}}` · **Body:**
  ```
  Hi {{to_name}},

  {{message}}

  — Your 2026 Cyber Research Roadmap
  {{time}}
  ```
In EmailJS **Account → Security**, enable "Allow EmailJS API for non-browser
applications" and copy your **Private Key**. Then add these repo **Actions
secrets** (Settings → Secrets and variables → Actions):
`EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`,
`EMAILJS_PRIVATE_KEY`, `TO_EMAIL`. The workflow then emails a reading nudge
(~08:30 Israel) and a study nudge (~19:00 Israel). Times are UTC in the cron and
shift ~1h across DST. Run it by hand from the **Actions** tab to test.

---
## 3. The contest (accounts + leaderboard) — optional
This turns on real sign-up/sign-in, per-user progress that syncs across devices,
and a shared leaderboard. Skip it and the app stays single-user/local.

1. **Create a free Supabase project** at https://supabase.com/ (New project).
2. **Run the schema:** open **SQL Editor → New query**, paste all of
   `supabase-setup.sql`, and **Run**.
3. **(Recommended) frictionless signup:** **Authentication → Providers → Email**
   → turn **Confirm email** OFF so people can sign in immediately. (Leave it ON if
   you prefer verified emails — the app handles both; users just confirm first.)
4. **Get your keys:** **Settings → API** → copy the **Project URL** and the
   **anon public** key.
5. **Paste them into `config.js`** (the `url` and `anon` fields) and commit.
6. Reload the site. You'll see a **Sign in** button (top-right) and a **🏆
   Leaderboard** tab. Share the URL — everyone signs up with an email + password
   and a display name, and races to complete tasks.

How isolation works: each player can only read/write their own row (Row-Level
Security), so nobody sees anyone else's notes; the leaderboard view exposes only
name + counts. The anon key is public by design — RLS is what protects the data.

---
## 4. Deploying a new version (easy, non-destructive)
Because the app stores progress under a stable key (`sapir_roadmap_v2`) and your
Supabase keys live in `config.js`, updating is safe and simple:

- **Just replace `index.html`** with the new one and commit (via `git push`, or
  GitHub's **Add file → Upload files** / the pencil-edit button). GitHub Pages
  redeploys automatically within a minute.
- **Don't** touch `config.js` — your keys and everyone's data stay put.
- Existing local progress is **not** wiped: the storage key is unchanged, and the
  first time a user signs in the app offers to import the progress already in
  their browser.
