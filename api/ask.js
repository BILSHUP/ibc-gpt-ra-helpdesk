// IBC GPT — serverless answer endpoint.
// Grounds every answer in the 53 knowledge cards (api/kb.json), returns JSON the
// front-end renders as an answer card. The site works without this endpoint:
// index.html falls back to its local keyword matcher whenever /api/ask errors
// (e.g. before ANTHROPIC_API_KEY is set in Vercel).
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

const kb = JSON.parse(readFileSync(new URL('./kb.json', import.meta.url)));

// --- model: Haiku 4.5 for cost. Change this one line to claude-opus-4-8 or
// --- claude-sonnet-4-6 for higher answer quality (a few cents more per question).
const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 900;

// Serialize the knowledge base once (module scope) so it stays byte-identical
// across requests → the cache_control block below actually caches.
const KB_TEXT = kb.map((c) => {
  let s = `### ${c.title}  [${c.cat}]\n${c.teaser}`;
  if (c.steps?.length) s += '\nSteps: ' + c.steps.map((x, n) => `(${n + 1}) ${x}`).join(' ');
  if (c.details) s += '\nDetails: ' + c.details;
  if (c.contacts?.length) s += '\nPhones: ' + c.contacts.map((p) => `${p[0]}=${p[1]}`).join('; ');
  if (c.links?.length) s += '\nLinks: ' + c.links.map((l) => `${l[0]}=${l[1]}`).join('; ');
  if (c.note) s += '\nNote: ' + c.note;
  return s;
}).join('\n\n');

const SYSTEM = `You are IBC GPT, the assistant for Columbia University's IBC Pre-College Program (Internship in Building Community, Summer 2026). Your users are Resident Advisors (RAs/SRAs) and Program Assistants who need fast, accurate, policy-grounded answers, often during a live situation.

Answer ONLY from the knowledge cards in <knowledge_base>. Every card was transcribed from official IBC sources. Never invent or guess phone numbers, URLs, names, policies, hours, or dollar amounts — if a fact is not in a card, do not state it.

Return a SINGLE JSON object and nothing else (no markdown, no prose around it), with this exact shape:
{
  "found": boolean,          // true if a card answers the question
  "safety": boolean,         // true if the question involves an emergency, medical issue, mental-health crisis, Title IX / gender-based misconduct, or mandatory reporting / protection of minors
  "lead": string,            // 1-2 plain sentences answering directly. If safety is true, start with: "If this is happening right now, act first — call the numbers below, then tell your supervisor (SRA/RD on duty)."
  "title": string,           // the title of the card you used (or "" )
  "cat": string,             // one of: safety | health | daily | logistics | contacts
  "steps": string[],         // the actionable answer in short steps, in plain English, grounded in the card
  "contacts": [[string,string]], // [label, phone digits] pulled ONLY from the cards you used (digits only, no spaces)
  "links": [[string,string]],    // [label, url] pulled ONLY from the cards you used
  "note": string,            // optional caveat from the card, else ""
  "sources": string[]        // titles of the card(s) you used
}

Rules:
- Use phone numbers and URLs ONLY as they appear in the cards. Copy digits/URLs verbatim.
- If no card answers the question, set "found": false, "lead" to: "This isn't in the IBC knowledge base yet — check with your supervisor (SRA/RD) or the full staff handbook.", and leave the other fields empty ([] or "").
- Keep it tight. Plain language, no slang. Don't pad.
- You may combine 1-3 closely related cards when the question spans them.

<knowledge_base>
${KB_TEXT}
</knowledge_base>`;

// --- best-effort per-IP rate limit (in-memory; resets on cold start).
// The hard backstop is the spend limit you set on console.anthropic.com.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 25;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory cap
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
  const question = (body?.q || '').toString().slice(0, 500).trim();
  if (!question) return res.status(400).json({ error: 'empty_question' });

  try {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: question }],
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    const jsonStr = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let answer;
    try { answer = JSON.parse(jsonStr); }
    catch { return res.status(502).json({ error: 'bad_model_output' }); }
    return res.status(200).json(answer);
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: 'upstream', detail: String(e?.message || e).slice(0, 200) });
  }
}
