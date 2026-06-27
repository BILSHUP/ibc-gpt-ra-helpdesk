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
    **58 entries** as of 2026-06-27 (53 → 58 via the autonomous improvement pass on the
    `auto-improve` branch / PR #1: +5 cards — allergic reaction, heat exhaustion, move-out,
    off-campus harassment, RA time-off — plus many routing/tag, a11y, and content-accuracy fixes).
  - **To add/edit content, edit the `DATA` array.** `tags` drives the live search; add
    synonyms a stressed RA might type. `contacts` render as tap-to-call buttons (digits only).
  - The matcher filters a `STOP` set of common/intent words and scores **whole-word**
    matches above loose substrings (so "safe" doesn't win on "Safety", or "all" on
    "emotionALLy"). Search hay = title+tags+teaser only — **`steps[]` text is NOT
    indexed**, so put searchable synonyms in `tags`.
  - Categories: `safety`, `health`, `daily`, `logistics`, `contacts`.
- **LLM endpoint (`/api/ask`) — LIVE.** A Vercel serverless function that uses Claude
  (`claude-haiku-4-5`) as a **router**, not a generator. Active as of 2026-06-27 (key is set).
  - **Why a router (cost):** the endpoint does NOT stuff all cards into the prompt (that was
    ~15k tokens/question ≈ $0.017 → would burn a $5 key in <1 week). Instead `api/ask.js`:
    (1) keyword-**prefilters** the KB to the top 7 candidate cards (`prefilter()` mirrors the
    client matcher, scoring title+tags+teaser), (2) sends only those candidates' title/teaser/
    short-steps to Claude, (3) asks it to return only `{found, safety, title, lead}` — i.e. WHICH
    card answers + a 1-line lead + a safety flag. **The model never emits phone numbers / links /
    steps.** If the prefilter finds nothing, it skips the model call entirely (free).
  - **Client renders the real card locally:** `respondToQuery()` → `askLLM()` POSTs `/api/ask`;
    on success it looks up `DATA.find(d=>d.title===j.title)` and renders that card via the existing
    `answerCard()` with the model's lead + a "✨ AI answer" tag. So card facts come from local
    `DATA`, never the model (cheaper **and** zero chance of a hallucinated number). The model's
    `lead` is `esc()`-escaped. A bad/unknown title, any non-200, or a thrown fetch → instant local
    `keywordRespond()` fallback. The site behaves like the pure-keyword version whenever the
    endpoint is unavailable (incl. before a key is set: returns `503 llm_disabled`).
  - **Cost:** ~1,000 input + ~60 output tokens/question ≈ **$0.0013/question** → a **$5 key lasts
    a full summer** (~3,500–3,800 questions; 10 RAs × 5/day fits). Prefilter misses on slang the
    tags don't cover (e.g. had to add "wasted/blacked out" to the intoxication card) — fix by
    enriching that card's `tags`, then `npm run build:kb`. The hard backstop is the **spend cap
    the user set on console.anthropic.com** ($5 loaded).
  - **Safety rails:** in-memory per-IP rate limit (20/5min), `max_tokens` 220, `maxDuration` 15s
    (`vercel.json`), question capped at 300 chars, returned title validated against the KB.
  - `scripts/build-kb.mjs` regenerates `api/kb.json` (incl. `tags` for the server prefilter) from
    the `DATA` array — single source of truth. Run `node scripts/build-kb.mjs` (or `npm run
    build:kb`) after editing cards, **and redeploy** so the function ships the new KB.
  - **Model:** Haiku 4.5 is plenty for routing; bumping to Sonnet/Opus barely changes routing
    quality but costs more — keep Haiku unless answers regress. One-line change in `api/ask.js`.

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
5. ~~**Real LLM chatbot.**~~ ✅ **LIVE** (2026-06-27) — `/api/ask` router endpoint on
   `claude-haiku-4-5`; key is set in Vercel + a $5 spend cap is loaded on console.anthropic.com.
   Re-architected from "stuff all cards" to a **prefilter→route→render-locally** design so $5
   lasts the summer (~$0.0013/question). See the **LLM endpoint** bullet under "What's built."
   Optional next: add a usage/cost log; expose a "report a wrong answer" path; enrich card `tags`
   with slang as misses surface (router recall = only as good as the tags).

## Conventions
- Keep it a single static file unless there's a strong reason to add a framework.
- When adding facts, cite from the source docs above; defer to the live docs if anything changed.
