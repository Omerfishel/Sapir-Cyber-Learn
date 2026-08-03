// Sends a playful, Duolingo-style STUDY or READING nudge from Bao — Sapir's panda
// study buddy — via EmailJS.
// Runs on a schedule from GitHub Actions — no open tab needed.
// Rotates randomly through many variants and features today's hottest article
// from feed.json (produced by scripts/build-feed.mjs) when available.
//
// Secrets: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY,
// EMAILJS_PRIVATE_KEY, TO_EMAIL. Optional: APP_URL.

import { readFileSync } from 'node:fs';

const {
  EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY,
  EMAILJS_PRIVATE_KEY, TO_EMAIL, SCHEDULE, DISPATCH_TYPE, APP_URL
} = process.env;

const app  = (APP_URL && APP_URL.trim()) || 'https://omerfishel.github.io/Sapir-Cyber-Learn/';
const type = (DISPATCH_TYPE && DISPATCH_TYPE.trim())
  ? DISPATCH_TYPE.trim()
  : (SCHEDULE === '0 16 * * *' ? 'study' : 'reading');

const rand = a => a[Math.floor(Math.random() * a.length)];

// ---- featured article from the live feed (if the feed workflow has run) ----
let feat = null;
try {
  const j = JSON.parse(readFileSync(new URL('../feed.json', import.meta.url), 'utf8'));
  const items = (j.items || []).filter(x => x && x.title && x.link);
  if (items.length) feat = rand(items.slice(0, 8)); // one of the 8 freshest
} catch { /* no feed yet — fine */ }

const readBlock = feat
  ? { label: rand(['🔥 Today’s hottest read','📰 Fresh off the feed','🧠 Brain snack of the day','👀 You’ll want to see this']),
      title: feat.title, source: feat.source || 'Security feed', url: feat.link }
  : { label: '📰 Fresh in the app',
      title: 'Today’s security drops are waiting in the Feed',
      source: 'Sapir Cyber Learn', url: app + '#feed' };

// ---- variant pools ----
const STUDY = [
  { kicker:'STUDY TIME', headline:'Sapir. Bao is watching. 🐼',
    subline:'You said 2026 was the year. The roadmap’s open, a task has your name on it, and this little panda refuses to nap until you start. Fifteen minutes — that’s the whole ask.',
    cta:'Start today’s task ▸', streak:'🔥 Your streak is Bao’s favourite toy. Please don’t take it away.',
    sign:'— Bao 🐼 (definitely not guilt-tripping you)' },
  { kicker:'STUDY TIME', headline:'Plot twist: the tasks don’t finish themselves 😎',
    subline:'Shocking, Bao knows. Open the tracker, hit ▶ Focus, and let one Pomodoro carry you. A single block and you’re officially winning today.',
    cta:'Open the tracker ▸', streak:'Skip today and the streak resets. Bao remembers everything. 🐼',
    sign:'— Bao, tapping the tiny watch ⌚' },
  { kicker:'STUDY TIME', headline:'Knock knock. It’s your potential 🚪',
    subline:'It’s been on the doorstep next to a very patient panda all day. Let them both in — one focused task and you’re back in the game.',
    cta:'Let it in ▸', streak:'A task a day keeps the impostor syndrome away. Bao read that somewhere.',
    sign:'— Bao 🐼 (management, sort of)' },
  { kicker:'PACE CHECK', headline:'Ahead-of-plan looks adorable on you 🏇',
    subline:'Want to keep the lead? One task today holds the pace and the bragging rights. Behind the plan? Even better reason to open the app and claw it back — Bao believes in you.',
    cta:'Check my pace ▸', streak:'The leaderboard doesn’t nap. Bao’s watching it for you. 👀',
    sign:'— Coach Bao (supportive, mildly pushy) 🐼' },
  { kicker:'STUDY TIME', headline:'Two minutes to start. Zero regret. ⏱️',
    subline:'The hardest part is opening the tab — and you’re basically already here. Pick a task, start the timer, and make one panda very proud.',
    cta:'Two-minute start ▸', streak:'🔥 Feed the streak before Bao starts sulking.',
    sign:'— Bao, the little push you needed 🐼' },
  { kicker:'STREAK ALERT', headline:'Bao is doing the sad eyes 🥺',
    subline:'Nothing logged yet today, and your streak is wobbling on the edge. One task is all it takes to turn this frown upside down. Do it for the panda.',
    cta:'Save the streak ▸', streak:'Momentum is expensive to rebuild. Bao would rather not.',
    sign:'— Bao 🐼 (nose pressed to the glass)' },
];
const READING = [
  { kicker:'READING RADAR', headline:'Fresh intel just dropped 📰',
    subline:'The best security minds published while you slept. Bao fetched today’s must-read — skim it, then log it to feed the streak.',
    cta:'Open the feed ▸', streak:'Two reads a week keeps your TTPs current and your excuses irrelevant.',
    sign:'— Bao 📡🐼' },
  { kicker:'READING RADAR', headline:'Stay sharp or get dull. Bao’s call is obvious 🔪',
    subline:'New research, new exploits, new deep-dives are live in the feed. Grab one, learn something, mark it read. Easy dopamine, panda-approved.',
    cta:'Feed my brain ▸', streak:'🔥 Reading streaks count too. Keep it alive for Bao.',
    sign:'— Your slightly smug panda buddy 🐼' },
  { kicker:'READING RADAR', headline:'The internet’s been busy. So should you 🌐',
    subline:'While you were away, the feed filled up with spicy security reads. Bao lined up the tastiest one below — see where the rabbit hole goes.',
    cta:'Down the rabbit hole ▸', streak:'One good read now beats ten saved-for-later tabs.',
    sign:'— Bao 📡🐼' },
  { kicker:'READING RADAR', headline:'A hungry panda wants a brain snack 🧠',
    subline:'Feed it something from today’s drop. This one looks delicious — open it, skim it, log the read, keep Bao full.',
    cta:'Serve the snack ▸', streak:'🔥 Don’t let the reading streak go hungry.',
    sign:'— Bao, room service (security edition) 🐼' },
];

const v = rand(type === 'study' ? STUDY : READING);
const subject = type === 'study'
  ? rand(['🐼 Sapir, study time','🐼 Bao is watching, Sapir','▶️ 15 minutes. Let’s go, Sapir','🥺 Bao is doing the sad eyes, Sapir'])
  : rand(['📰 Fresh security reads for you','🧠 Bao’s serving a brain snack','📡 Reading radar — new drops','🐼 Stay sharp, Sapir']);
const cta_url = type === 'study' ? (app + '#today') : (app + '#feed');

// plaintext fallback (used if your EmailJS template still renders {{message}})
const message =
  `${v.headline}\n\n${v.subline}\n\n` +
  `${readBlock.label}: ${readBlock.title} — ${readBlock.source}\n${readBlock.url}\n\n` +
  `${v.streak}\n\n👉 ${v.cta}  ${cta_url}\n\n${v.sign}`;

const payload = {
  service_id:  EMAILJS_SERVICE_ID,
  template_id: EMAILJS_TEMPLATE_ID,
  user_id:     EMAILJS_PUBLIC_KEY,
  accessToken: EMAILJS_PRIVATE_KEY,
  template_params: {
    to_email: TO_EMAIL || 'sapirtwig@gmail.com',
    to_name: 'Sapir',
    subject, kicker: v.kicker, headline: v.headline, subline: v.subline,
    cta_text: v.cta, cta_url, streak_line: v.streak,
    read_label: readBlock.label, read_title: readBlock.title,
    read_source: readBlock.source, read_url: readBlock.url,
    sign: v.sign, message, title: subject,
    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jerusalem' })
  }
};

const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
});
const body = await res.text();
if (!res.ok) { console.error('EmailJS send failed:', res.status, body); process.exit(1); }
console.log(`Sent "${type}" nudge to ${payload.template_params.to_email} — variant: "${v.headline}"`);
