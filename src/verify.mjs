// Verify an exam's sources against real gcc before publishing.
//
//   node src/verify.mjs
//
// Splices _solutions.js's code into each skeleton in _skeletons.js, compiles
// with the same Compiler Explorer endpoint the live page uses, and checks
// every case in _tests.json. This is the one source of truth for "does this
// exam actually work" - run it after writing/editing any of the six
// fragments and before `node src/build.mjs <n>`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(here, f), 'utf8');

const TESTS = JSON.parse(read('_tests.json'));

// _skeletons.js / _solutions.js are executable JS (`const SKELETONS = {...}`,
// `const SOLUTIONS = {...}`) - loaded the same way build.mjs splices them.
// new Function() here only ever evaluates files this repo's own author wrote
// under src/ (never network input, never anything a student/viewer supplies) -
// the same trust level as `require()`-ing a local config file.
const SKELETONS = new Function(read('_skeletons.js') + '\nreturn SKELETONS;')();
const SOLUTIONS = new Function(read('_solutions.js') + '\nreturn SOLUTIONS;')();

const CE = 'https://godbolt.org/api/compiler/cg132/compile';
const joinText = a => (a || []).map(x => x.text).join('\n');

async function gcc(code, stdin) {
  const r = await fetch(CE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      source: code,
      options: {
        userArguments: '-std=c99 -Wall -fno-diagnostics-color -lm',
        executeParameters: { args: [], stdin: stdin || '' },
        filters: { execute: true },
        compilerOptions: { executorRequest: true }
      }
    })
  });
  if (!r.ok) throw new Error('gcc endpoint returned ' + r.status);
  const j = await r.json();
  const b = j.buildResult || {};
  return {
    buildFailed: b.code !== undefined && b.code !== 0,
    diagnostics: (joinText(b.stderr) + '\n' + joinText(b.stdout)).trim(),
    stdout: joinText(j.stdout)
  };
}

const renameMain = src => src.replace(/\bint\s+main\s*\(\s*(void)?\s*\)/, 'int __student_main(void)');

function driverFor(q) {
  const call = q === 'q3' ? 'examT_q3(buf, k)' : `examT_${q}(arr, n, ${q === 'q2' ? 'x' : 'k'})`;
  if (q === 'q3') return `
int main(void){ int T; if(scanf("%d",&T)!=1) return 1;
  for(int t=0;t<T;t++){ int len; if(scanf("%d",&len)!=1) return 1;
    char* buf=(char*)malloc((size_t)len+2); char* ref=(char*)malloc((size_t)len+2);
    if(scanf("%s",buf)!=1) return 1; int k; if(scanf("%d",&k)!=1) return 1;
    for(int i=0;i<=len;i++) ref[i]=buf[i];
    int r=${call}; int mut=0; for(int i=0;i<=len;i++) if(ref[i]!=buf[i]) mut=1;
    printf("%d %d\\n", r, mut); free(buf); free(ref);} return 0;}`;
  return `
int main(void){ int T; if(scanf("%d",&T)!=1) return 1;
  for(int t=0;t<T;t++){ int n; if(scanf("%d",&n)!=1) return 1;
    int* arr=NULL; if(n>0){ arr=(int*)malloc(sizeof(int)*(size_t)n);
      for(int i=0;i<n;i++) if(scanf("%d",&arr[i])!=1) return 1; }
    int ${q === 'q2' ? 'x' : 'k'}; if(scanf("%d",&${q === 'q2' ? 'x' : 'k'})!=1) return 1;
    printf("%d 0\\n", ${call}); free(arr);} return 0;}`;
}

function driverStdin(q, cases) {
  const L = [String(cases.length)];
  for (const c of cases) {
    if (q === 'q3') { L.push(String(c.args.s.length)); L.push(c.args.s); L.push(String(c.args.k)); }
    else { L.push(String(c.args.n)); L.push(c.args.arr.join(' ')); L.push(String(q === 'q2' ? c.args.x : c.args.k)); }
  }
  return L.join('\n') + '\n';
}

function spliceSolution(skeleton, fnName, solutionCode) {
  // skeletons declare a prototype ("...;") before the real definition
  // ("... {"), so take the LAST occurrence - the definition, not the prototype.
  const marker = 'int ' + fnName + '(';
  const idx = skeleton.lastIndexOf(marker);
  if (idx === -1) throw new Error('signature for ' + fnName + ' not found in skeleton');
  const braceStart = skeleton.indexOf('{', idx);
  let depth = 0, i = braceStart;
  for (; i < skeleton.length; i++) {
    if (skeleton[i] === '{') depth++;
    else if (skeleton[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return skeleton.slice(0, idx) + solutionCode + skeleton.slice(i);
}

let totalPass = 0, totalFail = 0, hadError = false;
for (const q of ['q2', 'q3', 'q4']) {
  const cases = TESTS[q];
  if (!cases || !cases.length) { console.log(q + ': NO TESTS in _tests.json'); hadError = true; continue; }
  if (!SOLUTIONS[q]) { console.log(q + ': NO SOLUTIONS.' + q + ' in _solutions.js'); hadError = true; continue; }
  let src;
  try {
    src = spliceSolution(SKELETONS[q], 'examT_' + q, SOLUTIONS[q].code);
  } catch (e) { console.log(q + ': splice failed - ' + e.message); hadError = true; continue; }

  const res = await gcc(renameMain(src) + '\n' + driverFor(q), driverStdin(q, cases));
  if (res.buildFailed) {
    console.log(q + ': COMPILE FAILED\n' + res.diagnostics);
    hadError = true; continue;
  }
  const lines = (res.stdout || '').trim().split('\n').filter(Boolean);
  let pass = 0, fail = 0;
  cases.forEach((tc, i) => {
    const got = (lines[i] || '').trim().split(/\s+/)[0];
    if (got === String(tc.expect)) pass++;
    else { fail++; console.log('  ' + q + '/' + tc.name + ': want ' + tc.expect + ' got ' + JSON.stringify(got)); }
  });
  totalPass += pass; totalFail += fail;
  console.log(q + ': ' + pass + '/' + cases.length + ' passed' + (res.diagnostics ? ' (warnings present)' : ''));
}

console.log('');
if (hadError || totalFail > 0) {
  console.log('VERIFY FAILED - ' + totalFail + ' test failure(s), fix _solutions.js / _tests.json before building.');
  process.exit(1);
} else {
  console.log('VERIFY OK - ' + totalPass + '/' + totalPass + ' across q2/q3/q4.');
}
