// Build one exam page:  node src/build.mjs <examNumber>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const n = process.argv[2] || '1';
const here = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(here, f), 'utf8');

const out = read('_template.html')
  .replace('__PAPER__',     read('_paper.html'))
  .replace('__SKELETONS__', read('_skeletons.js'))
  .replace('__TESTS__',     read('_tests.json'))
  .replace('__Q1KEY__',     read('_q1key.txt').trim());

const dir = path.join(here, '..', n);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log(`built /${n}/index.html — ${out.length} chars`);
