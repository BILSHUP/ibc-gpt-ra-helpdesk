# IBC-GPT · RA Help Desk

A single-file, mobile-friendly help desk for Resident Advisors in Columbia
University's Pre-College Program (Internship in Building Community, Summer 2026).
An RA types their situation into a chat box and gets the next steps, tap-to-call
numbers, and links to the right forms and live documents.

**Live:** https://ibc-gpt-ra-helpdesk.vercel.app

## What it is

- **`index.html`** — the entire app. No build step, no dependencies. Open it in
  any browser; it works on phones. Deploying just means serving this static file.
- A conversational front-end over a keyword/synonym matcher and a `DATA` array of
  **44 situation cards** across safety, health, daily ops, logistics, and contacts.
- A pinned emergency call bar stays at the top; "Browse all" lists every topic.

## Editing content

All content lives in the `DATA` array near the bottom of `index.html`. Each entry:

```js
{cat, title, tags, teaser, steps[], custom?, contacts[[label,telDigits]], links[[label,url]], note?}
```

`tags` drives search — add synonyms a stressed RA might actually type. Searchable
text is `title + tags + teaser` only (step text is **not** indexed), so put search
terms in `tags`. `contacts` render as tap-to-call buttons (digits only).

## Run locally

```
npx serve -l 8000
```

Then open http://localhost:8000/.

## Sources

Content is transcribed from the IBC RA Handbook, SRA Master Doc, International
Student Scenarios, and the program's Canvas course (handbook, policies, forms,
protocols, and training decks). Schedules and rosters link to the live Google
docs rather than being frozen, so they stay current. See `CLAUDE.md` for details.

> Note: this hub lists program staff on-duty numbers and columbia.edu emails.
> Always defer to your SRA/RD and the live documents if anything has changed.
