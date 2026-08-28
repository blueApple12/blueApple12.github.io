// Build one exam page: node src/build.mjs <examNumber>
//
// _template.html owns every exam's look, layout, and behavior. A new exam
// only supplies content: never edit _template.html per-exam.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function buildPage({number = '1', sourceDir = here, outputRoot = path.join(here, '..')} = {}) {
  const read = f => fs.readFileSync(path.join(sourceDir, f), 'utf8');
  const meta = JSON.parse(read('_meta.json'));
  const replacements = [
    ['__PAPER__', read('_paper.html')],
    ['__SKELETONS__', read('_skeletons.js')],
    ['__SOLUTIONS__', read('_solutions.js')],
    ['__TESTS__', read('_tests.json')],
    ['__Q1KEY__', read('_q1key.txt').trim()],
    ['__PAGE_TITLE__', meta.pageTitle],
    ['__BRAND_TITLE__', meta.brandTitle],
    ['__BRAND_SUB__', meta.brandSub],
    ['__DRIVER_CORE__', read('driver-core.js')]
  ];

  let html = read('_template.html');
  for (const [placeholder] of replacements) {
    if (!html.includes(placeholder)) throw new Error(`Template placeholder missing: ${placeholder}`);
  }
  for (const [placeholder, value] of replacements) html = html.replace(placeholder, value);
  const unresolved = html.match(/__[A-Z0-9_]+__/);
  if (unresolved) throw new Error(`Template placeholder unresolved: ${unresolved[0]}`);

  const outputPath = path.join(outputRoot, String(number), 'index.html');
  fs.mkdirSync(path.dirname(outputPath), {recursive:true});
  fs.writeFileSync(outputPath, html);
  return {outputPath, html};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const number = process.argv[2] || '1';
  const {html} = buildPage({number});
  console.log(`built /${number}/index.html — ${html.length} chars`);
}
