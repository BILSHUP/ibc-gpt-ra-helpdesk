# IBC-GPT — RA Help Desk

A searchable knowledge hub / "tell it your situation, get the next steps" tool for
Resident Advisors in Columbia University's Pre-College Program (Internship in Building
Community, Summer 2026). Built for an RA (Bishop Switzer) to share with the RA team.

## What's built
- **`index.html`** — the whole app, single self-contained file (no build step, no
  dependencies). Open it in any browser; works on phones. Deploy = serve this static file.
  - A `DATA` array (JS, near the bottom of the file) holds every entry as
    `{cat, title, tags, teaser, steps[], custom?, contacts[[label,telDigits]], links[[label,url]], note?}`.
  - **To add/edit content, edit the `DATA` array.** `tags` drives the live search; add
    synonyms a stressed RA might type. `contacts` render as tap-to-call buttons (digits only).
  - Categories: `safety`, `health`, `daily`, `logistics`, `contacts`.
  - Features: sticky situation-search (keyword + synonym scoring), category chips, pinned
    emergency call bar, quick-reference links to the live Google docs.

## Source material (Google Drive — owner: bishopswitzer)
Raw text of the main doc is saved in `_source/RA_Handbook_2026.txt`. Key Drive file IDs:
- RA Handbook 2026 (Google Doc): `19fq9yWgzrpYA5QVgYNfs5YgBhrdauUBGunhgK4X4mg8`
- International Student Scenarios: `1s-tU0ZuiuGHfNcT3OjYyBruk2YIASNWzhdtLOOu4Fc0`
- SRA Master Doc 2026 (links/phones/forms): `1OrBEaIqdSVWiZxKhSPlXfaAR7_L1L1JhPq27VXZGy8A`
- Summer On-Call Schedule: `10rJl4f7dhTc5tyqL2LxyuWBMZxqbYN_MJi8Ho_3Gk1U`
- Session A RA Team Roster: `1_uycM9W1hg-4yT8tgkxaHHPtzWiMs_yiL2K4UwuksSA`
- Master Contact Sheet: `1krNw90MEuDc8hcWKo29Cg3dCg-3xtjaPNgEKhJ4XNtQ`
- Also: IBC Staff 2026 slides, BCD Groups, CPR/AED Groups, Floor Meeting Agenda, NYC Excursions.

All facts in `index.html` were transcribed from the Handbook, Master Doc, and Scenarios.
The hub deliberately links schedules/rosters to the **live** Google docs rather than freezing
them, so they stay current.

## Key facts encoded (sanity-check reference)
- Emergency: on-campus → Public Safety **212-854-5555** (24/7) then RD; off-campus → 911 then SRA/RD.
- On-duty: Carman SRA **212-814-0027**, RD on Duty **332-465-5827**, SRA on Duty (JJ+Wallach) **917-364-4454**.
- Curfew: in-building 9pm Sun–Thu / 10pm Fri–Sat; in-room 11pm / 12am; ends 6am.
  <30 min late → curfew tracker form; >30 min → Maxient + RD.
- Reports: Maxient incident report (policy/concern), bit.ly/gbmreport (gender-based),
  bit.ly/pomreport (minors; + 911, + NY hotline 800-342-3720).
- Escalation chain: SRA → RD → Assistant Director (Jeannette Sanchez) → Director.

## Remaining tasks
1. **Deploy.** Static site. From this folder: `npx vercel` (user has Vercel connected) or drag
   the folder to app.netlify.com/drop. Re-run to redeploy after edits.
   - ⚠️ Privacy: the page lists staff on-duty numbers + columbia.edu emails. A fully public URL
     exposes these. User chose public after being warned; offer password-gating if they reconsider.
2. **Canvas content.** Not yet pulled (no Canvas MCP exists). Use the browser while the user is
   logged into their Canvas course; collect links/policies/files and add as new `DATA` entries.
3. **Session recordings.** Need transcripts to be searchable — get the audio/video files, transcribe,
   then add summaries/links as `DATA` entries.
4. **More scenarios.** Expand `DATA` with situations the RA handles often.

## Conventions
- Keep it a single static file unless there's a strong reason to add a framework.
- When adding facts, cite from the source docs above; defer to the live docs if anything changed.
