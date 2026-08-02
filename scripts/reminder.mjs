// Sends a playful, Duolingo-style STUDY or READING nudge to Sapir via EmailJS.
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
  { kicker:'STUDY TIME', headline:'Sapir. The owl sees you. 🦉',
    subline:'You said 2026 was the year. The roadmap’s open, a task has your name on it, and future-you is getting impatient. Fifteen minutes — that’s the whole ask.',
    cta:'Start today’s task ▸', streak:'🔥 Your streak is watching. Don’t make it sad.',
    sign:'— The Roadmap (definitely not guilt-tripping you)' },
  { kicker:'STUDY TIME', headline:'Plot twist: the tasks don’t finish themselves 😎',
    subline:'Wild, we know. Open the tracker, hit ▶ Focus, and let a Pomodoro carry you. One block and you’re officially winning today.',
    cta:'Open the tracker ▸', streak:'Skip today and the streak resets. The streak remembers everything.',
    sign:'— Future you, tapping the watch ⌚' },
  { kicker:'STUDY TIME', headline:'Knock knock. It’s your potential 🚪',
    subline:'It’s been standing outside all day. Let it in — one focused task on the roadmap and you’re back in the game.',
    cta:'Let it in ▸', streak:'A streak a day keeps the impostor syndrome away.',
    sign:'— Management (it’s me, the app)' },
  { kicker:'PACE CHECK', headline:'Ahead-of-plan looks really good on you 🏇',
    subline:'Want to keep the lead? One task today holds the pace and the bragging rights. Behind the plan? Even better reason to open the app right now and claw it back.',
    cta:'Check my pace ▸', streak:'The leaderboard doesn’t sleep. Neither do your rivals. 👀',
    sign:'— Coach (supportive, mildly pushy)' },
  { kicker:'STUDY TIME', headline:'Two minutes to start. Zero regret. ⏱️',
    subline:'The hardest part is opening the tab — and you’re basically already here. Pick a task, start the timer, thank yourself later.',
    cta:'Two-minute start ▸', streak:'🔥 Feed the streak before it forgets your name.',
    sign:'— The little green push you needed' },
  { kicker:'STUDY TIME', headline:'Your rivals just logged in 👀',
    subline:'Okay, maybe they didn’t. But do you want to risk it? Bank a task, climb the board, flex responsibly.',
    cta:'Climb the board ▸', streak:'Momentum is expensive to rebuild. Don’t drop it today.',
    sign:'— Not a threat. A friendly nudge. 🦉' },
];
const READING = [
  { kicker:'READING RADAR', headline:'Fresh intel just dropped 📰',
    subline:'The best security minds published while you were sleeping. Here’s today’s must-read — skim it, then log it to feed the streak.',
    cta:'Open the feed ▸', streak:'Two reads a week keeps your TTPs current and your excuses irrelevant.',
    sign:'— The Radar 📡' },
  { kicker:'READING RADAR', headline:'Stay sharp or get dull. Your call 🔪',
    subline:'New research, new exploits, new deep-dives are live in the feed. Grab one, learn something, mark it read. Easy dopamine.',
    cta:'Feed my brain ▸', streak:'🔥 Reading streaks count too. Keep it alive.',
    sign:'— Your slightly smug study buddy' },
  { kicker:'READING RADAR', headline:'The internet’s been busy. So should you 🌐',
    subline:'While you were away, the feed filled up with spicy security reads. Start with the one below and see where the rabbit hole goes.',
    cta:'Down the rabbit hole ▸', streak:'One good read now beats ten saved-for-later tabs.',
    sign:'— The Radar 📡' },
  { kicker:'READING RADAR', headline:'Your brain called. It wants a snack 🧠',
    subline:'Feed it something from today’s drop. This one looks tasty — open it, skim it, log the read.',
    cta:'Serve the snack ▸', streak:'🔥 Don’t let the reading streak go hungry.',
    sign:'— Room service, security edition' },
];

const v = rand(type === 'study' ? STUDY : READING);
const subject = type === 'study'
  ? rand(['⏰ Sapir, study time','🦉 The streak is watching, Sapir','▶️ 15 minutes. Let’s go, Sapir','🏇 Keep your lead, Sapir'])
  : rand(['📰 Fresh security reads for you','🧠 Today’s brain snack is served','📡 Reading radar — new drops','🔪 Stay sharp, Sapir']);
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
