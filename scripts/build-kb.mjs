// Regenerates api/kb.json from the DATA array in index.html.
// Single source of truth = DATA in index.html. Run after editing cards:
//   node scripts/build-kb.mjs
import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const startMarker = 'const DATA = [';
const start = html.indexOf(startMarker);
const end = html.indexOf('\nconst CATS', start);
if (start < 0 || end < 0) { console.error('Could not locate DATA array in index.html'); process.exit(1); }

// Slice the array literal (drop the trailing semicolon) and eval it — it's our own trusted file.
let literal = html.slice(start + 'const DATA = '.length, end).trim();
if (literal.endsWith(';')) literal = literal.slice(0, -1);
const DATA = eval('(' + literal + ')');

const strip = (s) => String(s || '')
  .replace(/<[^>]+>/g, '')          // tags
  .replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ') // entities
  .replace(/\s+/g, ' ').trim();

const kb = DATA.map((d) => ({
  cat: d.cat,
  title: d.title,
  teaser: strip(d.teaser),
  steps: (d.steps || []).map(strip).filter(Boolean),
  details: strip(d.custom || ''),
  contacts: d.contacts || [],   // [[label, digits], ...]
  links: d.links || [],         // [[label, url], ...]
  note: strip(d.note || ''),
}));

writeFileSync(new URL('../api/kb.json', import.meta.url), JSON.stringify(kb));
console.log(`Wrote api/kb.json — ${kb.length} cards.`);
