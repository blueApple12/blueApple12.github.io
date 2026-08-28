// Build one exam page: node src/build.mjs <examNumber>
//
// _template.html owns every exam's look, layout, and behavior. A new exam
// only supplies content: never edit _template.html per-exam.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function buildPage({number = '1', sourceDir = here, outputRoot = path.join(here, '..')} = {}) {
  const pageNumber = String(number);
  if (!/^[1-9][0-9]*$/.test(pageNumber)) {
    throw new Error(`Invalid page number ${JSON.stringify(pageNumber)}: expected an unpadded positive decimal`);
  }
  const resolvedOutputRoot = path.resolve(outputRoot);
  const outputDirectory = path.resolve(resolvedOutputRoot, pageNumber);
  if (path.dirname(outputDirectory) !== resolvedOutputRoot) {
    throw new Error(`Invalid page number ${JSON.stringify(pageNumber)}: output must be an immediate child`);
  }
  const read = f => fs.readFileSync(path.join(sourceDir, f), 'utf8');
  const meta = JSON.parse(read('_meta.json'));
  const replacements = [
    ['__PAPER__', read('_paper.html')],
    ['__SKELETONS__', read('_skeletons.js')],
    ['__SOLUTIONS__', read('_solutions.js')],
    ['__TESTS__', read('_tests.json').replace(/</g, '\\u003c')],
    ['__Q1KEY__', read('_q1key.txt').trim()],
    ['__PAGE_TITLE__', meta.pageTitle],
    ['__BRAND_TITLE__', meta.brandTitle],
    ['__BRAND_SUB__', meta.brandSub],
    ['__DRIVER_CORE__', read('driver-core.js')]
  ];

  let html = read('_template.html');
  const replacementValues = new Map(replacements);
  const placeholders = html.match(/__[A-Z0-9_]+__/g) || [];
  for (const [placeholder] of replacements) {
    const count = placeholders.filter((item) => item === placeholder).length;
    if (count !== 1) throw new Error(`Template placeholder count for ${placeholder}: expected 1, found ${count}`);
  }
  for (const placeholder of placeholders) {
    if (!replacementValues.has(placeholder)) throw new Error(`Template unexpected placeholder: ${placeholder}`);
  }
  html = html.replace(/__[A-Z0-9_]+__/g, (placeholder) => replacementValues.get(placeholder));

  const outputPath = path.join(outputDirectory, 'index.html');
  fs.mkdirSync(path.dirname(outputPath), {recursive:true});
  fs.writeFileSync(outputPath, html);
  return {outputPath, html};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const number = process.argv[2] || '1';
  const {html} = buildPage({number});
  console.log(`built /${number}/index.html — ${html.length} chars`);
}
