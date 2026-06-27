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
    **44 entries** as of 2026-06-27.
  - **To add/edit content, edit the `DATA` array.** `tags` drives the live search; add
    synonyms a stressed RA might type. `contacts` render as tap-to-call buttons (digits only).
  - The matcher filters a `STOP` set of common/intent words and scores **whole-word**
    matches above loose substrings (so "safe" doesn't win on "Safety", or "all" on
    "emotionALLy"). Search hay = title+tags+teaser only — **`steps[]` text is NOT
    indexed**, so put searchable synonyms in `tags`.
  - Categories: `safety`, `health`, `daily`, `logistics`, `contacts`.

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
   Ferrari, 5 int'l-student challenge areas). Remaining decks (Mediation, Policy Enforcement,
   Navigating Boundaries, Res Life, etc.) not yet mined.
3. **Session recordings.** Zoom training recordings have **no auto-transcript** (transcription
   wasn't enabled) and can't be transcribed here (no audio→text). Use the **slide decks** instead
   (download via Canvas file API `url`, read the PDF) — that's how the deck content above was added.
4. **More scenarios.** Keep expanding `DATA` with situations the RA handles often.
5. **(Optional) Real LLM chatbot.** Current chat is static keyword matching. True NL understanding
   would need a serverless endpoint + API key (can't expose a key on the public static site).

## Conventions
- Keep it a single static file unless there's a strong reason to add a framework.
- When adding facts, cite from the source docs above; defer to the live docs if anything changed.
