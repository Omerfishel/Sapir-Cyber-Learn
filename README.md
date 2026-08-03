# Sapir Cyber Learn — hosted roadmap, always-on reminders, and a contest

A single-page learning tracker for the 2026 cyber-research curriculum, hosted on
**GitHub Pages**, with **email reminders** (via GitHub Actions, so they fire even
when nobody's on the page) and an optional **multi-user contest** (sign-up /
sign-in + a shared leaderboard) powered by **Supabase**.

Files:
- `index.html` — the app (this is the only file that changes between versions).
- `config.example.js` — template for your Supabase keys. Copy it to `config.js`
  **once**, fill in `url`/`anon`, and your `config.js` then survives every update.
- `supabase-setup.sql` — run once to create the contest tables.
- `.github/workflows/reminders.yml` + `scripts/reminder.mjs` — the daily email cron (playful, rotating, features today's top article).
- `.github/workflows/feed.yml` + `scripts/build-feed.mjs` — builds `feed.json` (the live 📰 Feed) a few times a day.
- `emailjs-template.html` — the dark HTML email design to paste into EmailJS (one time).

---
## 1. Host it (GitHub Pages)
1. Put all these files in a GitHub repo (keep the folder structure).
2. **Settings → Pages** → Deploy from a branch → `main` / `/ (root)` → Save.
3. Live at `https://<user>.github.io/<repo>/`. Progress saves per-device in the
   browser; when the contest is on, it also syncs to each user's account.

## 2. Email reminders (EmailJS + GitHub Actions)
Create an EmailJS account, add a Gmail **Service**, and a **Template** with:
- **To Email:** `{{to_email}}` · **Subject:** `{{subject}}`
- **Body:** open the template's **Code (`</>`) view** and paste the entire
  contents of **`emailjs-template.html`**. That gives the dark, mobile-safe
  design with a big CTA button and a live "today's read" card. It uses these
  variables (all sent by `reminder.mjs`): `to_name`, `kicker`, `headline`,
  `subline`, `cta_text`, `cta_url`, `streak_line`, `read_label`, `read_title`,
  `read_source`, `read_url`, `sign`.
  *(Prefer plain text? The script also sends `{{message}}`, so a body of just
  `{{message}}` still works.)*
In EmailJS **Account → Security**, enable "Allow EmailJS API for non-browser
applications" and copy your **Private Key**. Then add these repo **Actions
secrets** (Settings → Secrets and variables → Actions):
`EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`,
`EMAILJS_PRIVATE_KEY`, `TO_EMAIL` (optionally `APP_URL` — defaults to your
Pages URL, used for the CTA button + deep-links). Each send **randomly rotates**
through many Duolingo-style variants voiced by **Bao the panda** 🐼 and, once
the feed is live, features the day's hottest article. The workflow then emails a reading nudge
(~08:30 Israel) and a study nudge (~19:00 Israel). Times are UTC in the cron and
shift ~1h across DST. Run it by hand from the **Actions** tab to test.

## 3. Live security feed (📰 Feed + Reading Radar)
The app shows a live **📰 Feed** of the latest security research, threat-intel
and papers, and the right-rail **Reading Radar** surfaces the freshest few. A
static page can't fetch third-party RSS directly (CORS), so a scheduled Action
does it server-side and writes `feed.json` next to the app:

1. `feed.yml` runs `scripts/build-feed.mjs` every ~6h (and on demand). It pulls
   ~28 curated sources, normalises them, dedupes, sorts newest-first, and writes
   `feed.json`. Individual feeds that fail are skipped.
2. It commits `feed.json` back to the repo (needs **Settings → Actions →
   General → Workflow permissions → Read and write**). Pushing it re-publishes
   Pages, so the app picks it up automatically (it also re-fetches every 15 min).
3. Until the first run, the Feed tab shows a friendly placeholder and the Radar
   falls back to the curated source list — nothing breaks.

Edit the `FEEDS` array in `scripts/build-feed.mjs` to add/remove sources; set the
`category` to one of the app's categories so it gets the right colour.

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
5. **Copy `config.example.js` → `config.js`**, paste your `url` and `anon` into it, and commit.
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
- **Don't** touch `config.js` — your keys and everyone's data stay put. The
  download ships `config.example.js` (never `config.js`), so even a “replace
  everything” upload can’t overwrite your real keys. If login/leaderboard ever
  vanish after an update, your `config.js` lost its keys — re-paste them from
  Supabase → Settings → API (or `git show <old-commit>:config.js`) and push.
- Existing local progress is **not** wiped: the storage key is unchanged, and the
  first time a user signs in the app offers to import the progress already in
  their browser.
