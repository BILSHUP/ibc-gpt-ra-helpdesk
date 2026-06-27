# IBC-GPT — RA Help Desk

A searchable knowledge hub / "tell it your situation, get the next steps" tool for
Resident Advisors in Columbia University's Pre-College Program (Internship in Building
Community, Summer 2026). Built for an RA (Bishop Switzer) to share with the RA team.

## What's built
- **`index.html`** — the whole app, single self-contained file (no build step, no
  dependencies). Open it in any browser; works on phones. Deploy = serve this static file.
  - **Chatbot UI:** an RA types their situation in a chat composer; the bot replies with a
    conversational lead-in + the matching answer card (steps, tap-to-call buttons, links) and
    related-topic quick chips. Pinned emergency call bar stays at the top. Browse-by-category
    is reachable via the "Browse all" chip. (Earlier version was a search dashboard; same
    `DATA` + scoring under a chat front-end.)
  - A `DATA` array (JS, near the bottom of the file) holds every entry as
    `{cat, title, tags, teaser, steps[], custom?, contacts[[label,telDigits]], links[[label,url]], note?}`.
    **53 entries** as of 2026-06-27.
  - **To add/edit content, edit the `DATA` array.** `tags` drives the live search; add
    synonyms a stressed RA might type. `contacts` render as tap-to-call buttons (digits only).
  - The matcher filters a `STOP` set of common/intent words and scores **whole-word**
    matches above loose substrings (so "safe" doesn't win on "Safety", or "all" on
    "emotionALLy"). Search hay = title+tags+teaser only — **`steps[]` text is NOT
    indexed**, so put searchable synonyms in `tags`.
  - Categories: `safety`, `health`, `daily`, `logistics`, `contacts`.
- **LLM endpoint (optional, `/api/ask`)** — a Vercel serverless function that answers
  free-text questions with a single grounded Claude call (model `claude-haiku-4-5`).
  - `index.html` is **LLM-first with the keyword matcher as instant fallback**: typed
    questions hit `respondToQuery()` → `askLLM()` POSTs `/api/ask`; on **any** non-200 the
    page falls back to the local `search()` matcher. So the site behaves **exactly as the
    pure-keyword version until `ANTHROPIC_API_KEY` is set in Vercel** — then the LLM activates.
    Exact-topic chips and Browse stay 100% local (no API call).
  - `scripts/build-kb.mjs` regenerates `api/kb.json` from the `DATA` array (single source of
    truth — run `node scripts/build-kb.mjs` after editing cards, or `npm run build:kb`).
  - `api/ask.js` stuffs all cards into a **prompt-cached** system block, forces a JSON answer
    (`{found,safety,lead,title,cat,steps,contacts,links,note,sources}`), and grounds strictly
    in the KB (refuses if not covered). Returns `503 llm_disabled` when no key is set.
  - `llmCard()` in `index.html` renders that JSON via the existing card UI — **all
    model-supplied text is `esc()`-escaped**, links restricted to `http(s):`/`mailto:`,
    phone digits sanitized. Small "✨ AI answer" tag distinguishes LLM answers from keyword ones.
  - **Safety/cost:** in-memory per-IP rate limit (25/5min), `max_tokens` 900, `maxDuration`
    15s (`vercel.json`). The hard backstop is the **spend limit the user sets on
    console.anthropic.com** — the endpoint is public. Cost ≈ $0.003/question warm (cached KB),
    ~$0.015 cold; a summer of normal use ≈ a few dollars.
  - **To enable:** add `ANTHROPIC_API_KEY` in Vercel project → Settings → Environment
    Variables (Production), redeploy. (Claude Code can't enter the key — user does this.)

## Run & deploy
- **Local preview:** `.claude/launch.json` defines a `static` server (`npx serve -l 8000`);
  serve redirects `/index.html` → `/`, so load `http://localhost:8000/`.
- **Deployed (LIVE, public):** **https://ibc-gpt-ra-helpdesk.vercel.app**
  Project is linked (Vercel scope `bishopswitzer-4098s-projects`, `.vercel/` gitignored).
  Redeploy after edits: `npx vercel deploy --prod --yes` from this folder.
  - ⚠️ Privacy: public URL exposes staff on-duty numbers + columbia.edu emails (user chose
    public, warned). Offer password-gating if they reconsider. Google-Docs/Canvas links are
    Columbia-login-gated, but training-session **Zoom recordings are open share links** — do
    NOT embed those on the public site; link the login-gated Canvas Training module instead.

## Source material (Google Drive — owner: bishopswitzer)
Raw text of the main doc is saved in `_source/RA_Handbook_2026.txt`. Key Drive file IDs:
- RA Handbook 2026 (Google Doc): `19fq9yWgzrpYA5QVgYNfs5YgBhrdauUBGunhgK4X4mg8`
- International Student Scenarios: `1s-tU0ZuiuGHfNcT3OjYyBruk2YIASNWzhdtLOOu4Fc0`
- SRA Master Doc 2026 (links/phones/forms): `1OrBEaIqdSVWiZxKhSPlXfaAR7_L1L1JhPq27VXZGy8A`
- Summer On-Call Schedule: `10rJl4f7dhTc5tyqL2LxyuWBMZxqbYN_MJi8Ho_3Gk1U`
- Session A RA Team Roster: `1_uycM9W1hg-4yT8tgkxaHHPtzWiMs_yiL2K4UwuksSA`
- Master Contact Sheet: `1krNw90MEuDc8hcWKo29Cg3dCg-3xtjaPNgEKhJ4XNtQ`
- Also: IBC Staff 2026 slides, BCD Groups, CPR/AED Groups, Floor Meeting Agenda, NYC Excursions.
- **Canvas course (Courseworks):** IBC Summer 2026, course id **219719**
  (`https://courseworks2.columbia.edu/courses/219719/modules`). Pulled 2026-06-26 via the
  Canvas API (`/api/v1/courses/219719/modules?include[]=items&per_page=100` — navigate to it in
  a logged-in browser; JS `fetch` is sandbox-blocked). Folded the durable external links
  (building proposal forms, Maxient POM `layout_id=19`, Public Safety protocols, programming
  docs) into `DATA`. Slide decks + Zoom recordings live in the course Training module.

All facts in `index.html` were transcribed from the Handbook, Master Doc, and Scenarios.
The hub deliberately links schedules/rosters to the **live** Google docs rather than freezing
them, so they stay current.

## Key facts encoded (sanity-check reference)
- Emergency: on-campus → Public Safety **212-854-5555** (24/7) then RD; off-campus → 911 then SRA/RD.
- On-duty: Carman SRA **212-814-0027**, RD on Duty **332-465-5827**, SRA on Duty (JJ+Wallach) **917-364-4454**.
- Curfew: in-building 9pm Sun–Thu / 10pm Fri–Sat; in-room 11pm / 12am; ends 6am.
  <30 min late → curfew tracker form; >30 min → Maxient + RD.
- Reports: Maxient incident report `layout_id=11` (policy/concern), bit.ly/gbmreport
  (gender-based), Maxient `layout_id=19` (Protection of Minors; + 911, + NY hotline 800-342-3720).
- Escalation chain: SRA → RD → Assistant Director (Jeannette Sanchez) → Director.

## Remaining tasks
1. ~~**Deploy.**~~ ✅ Done — live at https://ibc-gpt-ra-helpdesk.vercel.app (see Run & deploy).
2. ~~**Canvas content.**~~ ✅ Pulled course 219719; durable links folded in. Canvas *Pages*
   (Metrocard, Gym, Flex, Maintenance, Campus IDs, Room Reservations, Catering, P-Card check-out,
   Nextsource) → cards. Training **slide decks** transcribed via download→PDF read: Emergency
   Response Protocols + Working with International Students done (missing-student protocol,
   incident-severity matrix, NYPD reporting, parental-notification nuance, POM Exec Dir Rachel
   Ferrari, 5 int'l-student challenge areas). **Doc sweep done** (2026-06-27): also mined Health
   Protocols, Policy Enforcement & Student Conduct (ICE/checkpoint protocol, confront-a-violation,
   sanctions), Conference Housing/Maintenance (Hospitality Desk + minor/guided-access note),
   Shift Coverage (lobby/floater, swap approvers), BCD Debrief/IR Writing, Navigating Boundaries
   (money/crush/social-media/mandated-reporter), and the SPS Casual Employee Policies (20-hr cap).
   **Deliberately skipped** (orientation/reference/low-yield): IBC Welcome, RAs & SRAs, Intro to
   Res Life / Program Office, Commuter AA, Race & Identity, Community Building, Leading Through
   Conflict, Residential/Major Programming, Columbia Travels, Columbia Dining, CSA/CLERY,
   Disability/Pronouns guides, sample-programs/icebreakers/door-decs. Mediation deck overlaps the
   existing mediation card; NYC Situational Awareness overlaps the int'l-student NYC + excursion
   cards. Re-mine these if a specific gap surfaces.
3. **Session recordings.** Zoom training recordings have **no auto-transcript** (transcription
   wasn't enabled) and can't be transcribed here (no audio→text). Use the **slide decks** instead
   (download via Canvas file API `url`, read the PDF) — that's how the deck content above was added.
4. **More scenarios.** Keep expanding `DATA` with situations the RA handles often.
5. ~~**Real LLM chatbot.**~~ ✅ Built (2026-06-27) — `/api/ask` serverless function with a single
   grounded `claude-haiku-4-5` call; KB stuffed into a cached prompt; keyword matcher kept as
   instant fallback. See the **LLM endpoint** bullet under "What's built." Deployed and live but
   **inert until the user adds `ANTHROPIC_API_KEY` in Vercel + sets an Anthropic spend cap.**
   Optional next: switch model to `claude-sonnet-4-6`/`claude-opus-4-8` in `api/ask.js` if answer
   quality needs it; add a usage log; expose a "report a wrong answer" path.

## Conventions
- Keep it a single static file unless there's a strong reason to add a framework.
- When adding facts, cite from the source docs above; defer to the live docs if anything changed.
