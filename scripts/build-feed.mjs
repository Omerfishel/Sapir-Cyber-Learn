// Aggregates the latest posts from top security sources into feed.json.
// Runs in GitHub Actions (full internet, no CORS). Zero dependencies.
// Tolerant of individual feed failures — skips what it can't fetch/parse.

import { writeFileSync } from 'node:fs';

// name, RSS/Atom URL, category (must match the app's category colors).
const FEEDS = [
  ['Google Project Zero', 'https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss', 'Deep-dive'],
  ['Google Online Security', 'https://security.googleblog.com/feeds/posts/default?alt=rss', 'Threat intel'],
  ['PortSwigger Research', 'https://portswigger.net/research/rss', 'Deep-dive'],
  ['Trail of Bits', 'https://blog.trailofbits.com/feed/', 'Deep-dive'],
  ['Project Discovery', 'https://blog.projectdiscovery.io/rss/', 'Deep-dive'],
  ['watchTowr Labs', 'https://labs.watchtowr.com/rss/', 'Deep-dive'],
  ['Unit 42', 'https://unit42.paloaltonetworks.com/feed/', 'Threat intel'],
  ['Cisco Talos', 'https://blog.talosintelligence.com/rss/', 'Threat intel'],
  ['Check Point Research', 'https://research.checkpoint.com/feed/', 'Threat intel'],
  ['SentinelLabs', 'https://www.sentinelone.com/labs/feed/', 'Threat intel'],
  ['The DFIR Report', 'https://thedfirreport.com/feed/', 'Threat intel'],
  ['Rapid7', 'https://blog.rapid7.com/rss/', 'Threat intel'],
  ['Rhino Security Labs', 'https://rhinosecuritylabs.com/feed/', 'Cloud'],
  ['Datadog Security Labs', 'https://securitylabs.datadoghq.com/rss/feed.xml', 'Cloud'],
  ['Wiz Blog', 'https://www.wiz.io/feed/rss.xml', 'Cloud'],
  ['OpenSSF', 'https://openssf.org/feed/', 'Supply chain'],
  ['Socket', 'https://socket.dev/blog/rss.xml', 'Supply chain'],
  ['ReversingLabs', 'https://www.reversinglabs.com/blog/rss.xml', 'Supply chain'],
  ['Embrace The Red', 'https://embracethered.com/blog/index.xml', 'AI security'],
  ['Simon Willison', 'https://simonwillison.net/atom/everything/', 'AI security'],
  ['NVIDIA AI Red Team', 'https://developer.nvidia.com/blog/category/cybersecurity/feed/', 'AI security'],
  ['arXiv cs.CR', 'http://export.arxiv.org/rss/cs.CR', 'Papers'],
  ['The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'Newsletter'],
  ['BleepingComputer', 'https://www.bleepingcomputer.com/feed/', 'Newsletter'],
  ['Krebs on Security', 'https://krebsonsecurity.com/feed/', 'Newsletter'],
  ['Schneier on Security', 'https://www.schneier.com/feed/atom/', 'Newsletter'],
  ['tl;dr sec', 'https://tldrsec.com/feed.xml', 'Newsletter'],
  ['CISA Advisories', 'https://www.cisa.gov/cybersecurity-advisories/all.xml', 'TTP tracker'],
];

const decode = s => (s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
  .replace(/&amp;/g, '&');
const stripTags = s => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (block, name) => {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? m[1] : '';
};

function parseFeed(xml, source, category) {
  const out = [];
  const isAtom = /<entry[\s>]/.test(xml) && !/<item[\s>]/.test(xml);
  const splitOpen = isAtom ? /<entry[\s>]/ : /<item[\s>]/;
  const splitClose = isAtom ? /<\/entry>/ : /<\/item>/;
  const blocks = xml.split(splitOpen).slice(1);
  for (const raw of blocks) {
    const block = raw.split(splitClose)[0];
    const title = stripTags(tag(block, 'title'));
    let link = '';
    if (isAtom) {
      const links = block.match(/<link\b[^>]*>/gi) || [];
      const alt = links.find(l => /rel=["']?alternate/i.test(l)) || links.find(l => /href=/i.test(l));
      const h = alt && alt.match(/href=["']([^"']+)["']/i);
      link = h ? h[1] : '';
    } else {
      link = stripTags(tag(block, 'link'));
      if (!link) { const g = block.match(/<link[^>]*href=["']([^"']+)["']/i); if (g) link = g[1]; }
    }
    let date = decode(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date') || '').trim();
    const d = new Date(date); const iso = isNaN(d) ? '' : d.toISOString();
    const summary = stripTags(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content'));
    if (!title || !link) continue;
    out.push({ title: title.slice(0, 200), link: link.trim(), source, category, date: iso, summary: summary.slice(0, 260) });
  }
  return out;
}

async function getXML(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow',
      headers: { 'User-Agent': 'SapirCyberLearn/1.0 (+feed builder)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' } });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; } finally { clearTimeout(timer); }
}

const results = await Promise.allSettled(FEEDS.map(async ([name, url, cat]) => {
  const xml = await getXML(url);
  if (!xml) throw new Error('fetch failed: ' + name);
  const items = parseFeed(xml, name, cat);
  if (!items.length) throw new Error('no items: ' + name);
  return items;
}));

let ok = 0;
const flat = [];
results.forEach((r, i) => {
  if (r.status === 'fulfilled') { ok++; flat.push(...r.value); }
  else console.warn('skip', FEEDS[i][0], '-', r.reason && r.reason.message);
});

// dedupe by link, sort newest-first, cap
const seen = new Set(); const dedup = [];
for (const it of flat) { const k = it.link.split('#')[0]; if (seen.has(k)) continue; seen.add(k); dedup.push(it); }
dedup.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
const items = dedup.slice(0, 70);

writeFileSync('feed.json', JSON.stringify({ updated: new Date().toISOString(), count: items.length, sources: ok, items }));
console.log(`feed.json written: ${items.length} items from ${ok}/${FEEDS.length} sources`);
if (!items.length) process.exit(1);
