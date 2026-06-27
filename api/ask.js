// IBC GPT — serverless ROUTER endpoint (cost-optimized).
//
// Instead of stuffing all 53 cards into every request and asking the model to
// rewrite the whole answer (~15k tokens in, ~450 out → ~$0.017/question, which
// would burn a $5 key in under a week), this endpoint:
//   1. keyword-prefilters the knowledge base to a handful of candidate cards,
//   2. sends ONLY those candidates' title/teaser/steps to Claude,
//   3. asks it to just PICK the best card + write a 1-line lead + flag safety.
// The front-end then renders the real card from its own local copy, so phone
// numbers / links never pass through the model (cheaper AND no hallucinated
// facts). Cost ≈ $0.0015/question → a $5 key lasts a summer of normal use.
//
// The site works without this endpoint: index.html falls back to its local
// keyword matcher whenever /api/ask errors (e.g. before ANTHROPIC_API_KEY is set).
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

const kb = JSON.parse(readFileSync(new URL('./kb.json', import.meta.url)));

// --- model: Haiku 4.5 — cheapest current model, plenty for routing. Routing
// --- quality barely differs from Sonnet/Opus here, so this stays on Haiku.
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 220;        // output is only {found,safety,lead,title} — tiny
const N_CANDIDATES = 7;        // cards sent to the model per question
const STEPS_SNIPPET = 200;     // chars of steps shown per candidate

// --- lightweight keyword prefilter (mirrors index.html's matcher) -------------
const STOP = new Set("a an the is are am was were be been being to of in on at it its this that these those my your our their his her them they i im we he she you with and or for as do does did has have had will would can could should student students someone somebody anybody person resident residents kid kids guy girl boy how what when where who why help need needs got get all any find finding locate look looking want wants like about info".split(/\s+/));

function prefilter(term) {
  let words = term.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
  const meaningful = words.filter((w) => !STOP.has(w));
  if (meaningful.length) words = meaningful;
  if (!words.length) return [];
  return kb.map((c, i) => {
    const hay = (c.title + ' ' + (c.tags || '') + ' ' + c.teaser).toLowerCase();
    const titleL = c.title.toLowerCase();
    let score = 0;
    words.forEach((w) => {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
      if (re.test(hay)) score += 2; else if (hay.includes(w)) score += 1;
      if (re.test(titleL)) score += 2; else if (titleL.includes(w)) score += 1;
    });
    return { c, i, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, N_CANDIDATES);
}

const SYSTEM = `You are IBC GPT, the assistant for Columbia University's IBC Pre-College Program (Internship in Building Community, Summer 2026). Your users are Resident Advisors (RAs/SRAs) handling live residential situations.

You are given the user's question and a short list of CANDIDATE knowledge cards (each was transcribed from official IBC sources). Your job is ONLY to route: pick the single card that best answers the question, write a brief conversational lead-in, and flag safety. You do NOT write the steps, phone numbers, or links — the app renders those from the chosen card.

Return a SINGLE JSON object and nothing else:
{
  "found": boolean,   // true only if one of the candidate cards genuinely answers the question
  "safety": boolean,  // true if the question involves an emergency, medical issue, mental-health crisis, Title IX / gender-based misconduct, or protection of minors
  "title": string,    // the EXACT title of the chosen card, copied verbatim — or "" if none fits
  "lead": string      // 1 short, calm sentence introducing the answer. If safety is true, begin with: "If this is happening right now, act first — call the numbers below, then tell your supervisor (SRA/RD on duty)."
}

Rules:
- Choose ONLY from the candidate cards. Copy the chosen "title" character-for-character.
- If none of the candidates actually answers the question, set found=false, title="", and lead="This isn't in the IBC knowledge base yet — check with your supervisor (SRA/RD) or the full staff handbook."
- Keep the lead to one plain sentence. No markdown, no lists, no phone numbers, no links.`;

// --- best-effort per-IP rate limit (in-memory; resets on cold start).
// The hard backstop is the spend limit you set on console.anthropic.com.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    // No key configured yet → tell the front-end to use its local fallback.
    return res.status(503).json({ error: 'llm_disabled' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = (body?.q || '').toString().slice(0, 300).trim();
  if (!question) return res.status(400).json({ error: 'empty_question' });

  // Prefilter locally — if nothing keyword-matches, skip the model call entirely
  // (saves money) and let the client show its own "no match" message.
  const cands = prefilter(question);
  if (!cands.length) return res.status(200).json({ found: false, safety: false, title: '', lead: "This isn't in the IBC knowledge base yet — check with your supervisor (SRA/RD) or the full staff handbook." });

  const candText = cands.map(({ c }, n) => {
    let s = `${n + 1}. "${c.title}" [${c.cat}] — ${c.teaser}`;
    if (c.steps?.length) s += ` // ${c.steps.join(' ').slice(0, STEPS_SNIPPET)}`;
    return s;
  }).join('\n');

  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Question: ${question}\n\nCandidate cards:\n${candText}` }],
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    const jsonStr = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let answer;
    try { answer = JSON.parse(jsonStr); }
    catch { return res.status(502).json({ error: 'bad_model_output' }); }
    // Guard: the chosen title must be a real card title (no fabrication).
    if (answer.found && !kb.some((c) => c.title === answer.title)) {
      answer.found = false; answer.title = '';
    }
    return res.status(200).json({
      found: !!answer.found,
      safety: !!answer.safety,
      title: typeof answer.title === 'string' ? answer.title : '',
      lead: typeof answer.lead === 'string' ? answer.lead.slice(0, 400) : '',
    });
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: 'upstream', detail: String(e?.message || e).slice(0, 200) });
  }
}
