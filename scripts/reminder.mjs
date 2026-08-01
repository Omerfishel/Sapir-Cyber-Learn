// Sends a study or reading nudge to Sapir via the EmailJS REST API.
// Runs on a schedule from GitHub Actions — no browser / open tab needed.
// Requires (as GitHub secrets): EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
// EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, TO_EMAIL.

const {
  EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY,
  EMAILJS_PRIVATE_KEY, TO_EMAIL, SCHEDULE, DISPATCH_TYPE
} = process.env;

// Decide which nudge to send: manual input wins, else the evening cron = study.
const type = (DISPATCH_TYPE && DISPATCH_TYPE.trim())
  ? DISPATCH_TYPE.trim()
  : (SCHEDULE === '0 16 * * *' ? 'study' : 'reading');

// A rotating set of durable, high-signal sources (mirrors the site's Reading Radar).
const READING = [
  ['Google Project Zero','https://googleprojectzero.blogspot.com/'],
  ['OWASP GenAI Security','https://genai.owasp.org/'],
  ['The DFIR Report','https://thedfirreport.com/'],
  ['Wiz Blog','https://www.wiz.io/blog'],
  ['Socket Blog','https://socket.dev/blog'],
  ['arXiv cs.CR (recent)','https://arxiv.org/list/cs.CR/recent'],
  ['tl;dr sec','https://tldrsec.com/'],
  ['abuse.ch','https://abuse.ch/'],
  ['Cisco Talos','https://blog.talosintelligence.com/'],
  ['Embrace The Red','https://embracethered.com/blog/'],
  ['watchTowr Labs','https://labs.watchtowr.com/'],
  ['Datadog Security Labs','https://securitylabs.datadoghq.com/'],
  ['ReversingLabs Blog','https://www.reversinglabs.com/blog'],
  ['USENIX Security','https://www.usenix.org/publications/proceedings'],
  ['MITRE ATT&CK','https://attack.mitre.org/'],
  ['Check Point Research','https://research.checkpoint.com/'],
  ['GitHub Security Lab','https://securitylab.github.com/research/'],
  ['SentinelLabs','https://www.sentinelone.com/labs/'],
  ['PortSwigger Research','https://portswigger.net/research'],
  ['CISA Known Exploited Vulns','https://www.cisa.gov/known-exploited-vulnerabilities-catalog']
];

function pick3() {
  const day = Math.floor((Date.now() - Date.UTC(2026,0,1)) / 86400000);
  const n = READING.length, base = (day * 3) % n, out = [];
  for (let i = 0; i < 3; i++) out.push(READING[(base + i) % n]);
  return out;
}

let subject, message;
if (type === 'study') {
  subject = '⏰ Study time, Sapir';
  message =
    'Time for a focused block on your 2026 cyber-research roadmap.\n\n' +
    'Open the tracker, pick today\'s task, and start a Pomodoro:\n' +
    '(paste your GitHub Pages URL here)\n\n' +
    'Small consistent blocks compound — see you in there.';
} else {
  const picks = pick3();
  subject = '📚 Reading radar — today\'s picks';
  message =
    'Two or three good reads a week keep you sharp on the latest TTPs, tooling and research. Today:\n\n' +
    picks.map(([name,url]) => `• ${name}\n  ${url}`).join('\n') +
    '\n\nRead one or two, then tap ✓ in the tracker to keep your streak.';
}

const payload = {
  service_id:  EMAILJS_SERVICE_ID,
  template_id: EMAILJS_TEMPLATE_ID,
  user_id:     EMAILJS_PUBLIC_KEY,     // public key
  accessToken: EMAILJS_PRIVATE_KEY,    // private key (required for server-side calls)
  template_params: {
    to_email: TO_EMAIL || 'sapirtwig@gmail.com',
    to_name:  'Sapir',
    subject,
    message,
    title:    subject,
    time:     new Date().toISOString()
  }
};

const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const body = await res.text();
if (!res.ok) {
  console.error('EmailJS send failed:', res.status, body);
  process.exit(1);
}
console.log(`Sent "${type}" nudge to ${payload.template_params.to_email}. EmailJS said:`, body || 'OK');
