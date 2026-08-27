# Generic Exam Driver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the exam-001-only test drivers with one validated, shared driver registry that supports every approved signature in exams 002–021 without changing those signatures or forking the page template.

**Architecture:** A plain JavaScript file defines ExamDrivers as a side-effect-free registry. Node loads it for verification and tests, while build.mjs injects the same bytes into the browser template. A version-2 manifest selects one allowlisted argument-shape driver and an explicit mutation policy per question; legacy exam 001 is normalized automatically.

**Tech Stack:** Node.js 22 built-in test runner, ECMAScript modules, browser JavaScript, C99, Compiler Explorer gcc 13.2.

## Global Constraints

- Preserve the exact C signatures in exams/002/spec.md through exams/021/spec.md.
- Preserve the six per-exam runtime fragments: _meta.json, _paper.html, _skeletons.js, _tests.json, _q1key.txt, and _solutions.js.
- Keep one shared pages/src/_template.html; never create per-exam forks.
- Keep exam 001's current _tests.json valid without editing it.
- Driver metadata is an allowlist selector; never accept arbitrary C source from JSON.
- Every behavior change follows red-green-refactor.
- Real publication verification remains node src/verify.mjs against gcc 13.2.
- Backtracking remains excluded.
- Never expose model solutions on the paper.

---

## File Map

- Create pages/src/driver-core.js: browser-safe ExamDrivers registry, normalization, validation, formatting, C driver generation, and stdin serialization.
- Create pages/src/driver-core.test.mjs: Node unit tests for the shared registry.
- Modify pages/src/verify.mjs: load ExamDrivers, normalize the manifest, and use the selected driver.
- Modify pages/src/_template.html: consume normalized tests and injected ExamDrivers; remove exam-001-only driver/format logic.
- Modify pages/src/build.mjs: inject driver-core.js and reject missing or unresolved placeholders.
- Create pages/src/build.test.mjs: build regression and placeholder tests.
- Modify pages/README.md: document version-2 test manifests and the driver vocabulary.

### Task 1: Lock the Manifest Contract

**Files:**
- Create: src/driver-core.js
- Create: src/driver-core.test.mjs

**Interfaces:**
- Consumes: legacy object with q2/q3/q4 arrays, or version-2 object with questions.q2/questions.q3/questions.q4.
- Produces: ExamDrivers.normalizeManifest(raw), returning {version:2, questions:{q2,q3,q4}}.
- Each normalized question is {driver, mutation, cases}.

- [ ] **Step 1: Write the failing legacy-normalization test**

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function loadCore() {
  const source = fs.readFileSync(new URL("./driver-core.js", import.meta.url), "utf8");
  return new Function(source + "\nreturn ExamDrivers;")();
}

test("normalizes the exam-001 legacy manifest", () => {
  const core = loadCore();
  const raw = {
    q2: [{name:"t01", args:{arr:[1], n:1, x:1}, expect:"0"}],
    q3: [{name:"t01", args:{s:"aa", k:1}, expect:"2"}],
    q4: [{name:"t01", args:{arr:[1], n:1, k:1}, expect:"1"}]
  };
  assert.deepEqual(core.normalizeManifest(raw), {
    version: 2,
    questions: {
      q2: {driver:"int_array_n_int", mutation:"allowed", cases:raw.q2},
      q3: {driver:"string_int", mutation:"forbidden", cases:raw.q3},
      q4: {driver:"int_array_n_int", mutation:"allowed", cases:raw.q4}
    }
  });
});
~~~

- [ ] **Step 2: Run the test and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because src/driver-core.js does not exist.

- [ ] **Step 3: Add the minimal normalizer**

~~~js
"use strict";
const ExamDrivers = (() => {
  const IDS = ["q2", "q3", "q4"];
  const LEGACY = {
    q2: {driver:"int_array_n_int", mutation:"allowed"},
    q3: {driver:"string_int", mutation:"forbidden"},
    q4: {driver:"int_array_n_int", mutation:"allowed"}
  };

  function normalizeManifest(raw) {
    if (raw && raw.version === 2) {
      return {version:2, questions:raw.questions};
    }
    const questions = {};
    for (const q of IDS) questions[q] = {...LEGACY[q], cases:raw[q]};
    return {version:2, questions};
  }

  return {normalizeManifest};
})();
~~~

- [ ] **Step 4: Run the test and verify GREEN**

Run: node --test src/driver-core.test.mjs

Expected: 1 test passed, 0 failed.

- [ ] **Step 5: Add failing validation tests**

Add table-driven assertions that reject:

~~~js
const invalid = [
  [{version:3, questions:{}}, /version/],
  [{version:2, questions:{}}, /q2/],
  [{version:2, questions:{q2:{driver:"c_source", mutation:"allowed", cases:[]}}}, /driver/],
  [{version:2, questions:{q2:{driver:"int", mutation:"sometimes", cases:[]}}}, /mutation/]
];
for (const [raw, message] of invalid) {
  assert.throws(() => core.normalizeManifest(raw), message);
}
~~~

Also test fewer than twelve cases with {requireMinimum:true}, duplicate case names, non-object args, and non-decimal expect.

- [ ] **Step 6: Run the validation tests and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because malformed manifests currently pass through.

- [ ] **Step 7: Implement strict normalization**

Define these constants and signature:

~~~js
const DRIVER_IDS = new Set([
  "int_array_n_int",
  "int_array_n",
  "sentinel_int_array_int",
  "matrix_rows_int",
  "string_only",
  "string_int",
  "string_char",
  "two_strings",
  "int_only",
  "two_ints",
  "two_int_arrays"
]);
const MUTATION_POLICIES = new Set(["allowed", "forbidden"]);

function normalizeManifest(raw, options = {}) {
  // Return a fresh normalized object.
  // Throw errors that include the question and case name.
}
~~~

Validation must require exactly q2/q3/q4, recognized driver and mutation values, arrays of cases, unique nonempty names, object args, and decimal-string expect. With requireMinimum:true, require at least twelve cases per question.

- [ ] **Step 8: Run the complete manifest tests and verify GREEN**

Run: node --test src/driver-core.test.mjs

Expected: all manifest tests pass with 0 failures.

- [ ] **Step 9: Commit**

~~~powershell
git add src/driver-core.js src/driver-core.test.mjs
git commit -m "Add generic exam manifest contract"
~~~

### Task 2: Implement Typed Argument Validation and Display

**Files:**
- Modify: src/driver-core.js
- Modify: src/driver-core.test.mjs

**Interfaces:**
- Consumes: driver id and case args.
- Produces: ExamDrivers.validateArgs(driver, args), ExamDrivers.formatArgs(driver, args), and safe stdin tokens.

- [ ] **Step 1: Write failing table-driven schema tests**

Use one valid and at least two invalid cases for each driver:

~~~js
const valid = {
  int_array_n_int: {arr:[1,2], n:2, value:7},
  int_array_n: {arr:[1,2], n:2},
  sentinel_int_array_int: {arr:[1,3,5], value:3},
  matrix_rows_int: {mat:[[1,2],[3,4]], m:2, cols:2, value:3},
  string_only: {s:"abba"},
  string_int: {s:"abba", value:2},
  string_char: {s:"abba", value:"b"},
  two_strings: {a:"abc", b:"abd"},
  int_only: {value:7},
  two_ints: {first:7, second:3},
  two_int_arrays: {a:[1,2], na:2, b:[1,2,3], nb:3}
};
for (const [driver, args] of Object.entries(valid)) {
  assert.doesNotThrow(() => core.validateArgs(driver, args));
}
assert.throws(
  () => core.validateArgs("int_array_n_int", {arr:[1], n:2, value:0}),
  /length/
);
assert.throws(
  () => core.validateArgs("matrix_rows_int", {mat:[[1],[2,3]], m:2, cols:1, value:0}),
  /rectangular/
);
assert.throws(
  () => core.validateArgs("string_char", {s:"abc", value:"xy"}),
  /single character/
);
~~~

- [ ] **Step 2: Run and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because validateArgs is absent.

- [ ] **Step 3: Implement the exact schemas**

Use safe signed 32-bit integers. Require n/na/nb/m/cols to match actual data. Reject NUL inside strings because the C functions receive NUL-terminated strings. Reject INT_MIN as logical data for sentinel_int_array_int. Return defensive copies so browser custom tests cannot mutate the manifest.

- [ ] **Step 4: Add failing escaping and formatting tests**

~~~js
assert.equal(core.cString('a"b\\c\n'), '"a\\"b\\\\c\\n"');
assert.equal(core.cChar("'"), "'\\''");
assert.match(core.formatArgs("two_strings", {a:"abc", b:"abd"}), /a=/);
assert.match(core.formatArgs("two_int_arrays", {a:[1],na:1,b:[2],nb:1}), /nb=1/);
~~~

- [ ] **Step 5: Run and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because literal serializers and generic formatting are absent.

- [ ] **Step 6: Implement cString, cChar, and formatArgs**

Escape backslash, double quote, single quote where applicable, newline, carriage return, tab, and bytes outside printable ASCII. Format long arrays and strings with bounded previews while retaining lengths.

- [ ] **Step 7: Run and verify GREEN**

Run: node --test src/driver-core.test.mjs

Expected: all schema, escaping, and display tests pass.

- [ ] **Step 8: Commit**

~~~powershell
git add src/driver-core.js src/driver-core.test.mjs
git commit -m "Validate generic exam driver arguments"
~~~

### Task 3: Generate All C Drivers

**Files:**
- Modify: src/driver-core.js
- Modify: src/driver-core.test.mjs

**Interfaces:**
- Produces: ExamDrivers.driverFor(q, question, cases) and ExamDrivers.driverStdin(question, cases).
- Driver output prints result and mutation bit as two whitespace-separated integers per case.

- [ ] **Step 1: Write failing exact-call tests**

For one case of every driver id, assert the generated C contains these calls:

~~~text
examT_q2(arr, n, value)
examT_q2(arr, n)
examT_q2(arr, value)
examT_q2(mat, m, value)
examT_q3(buf)
examT_q3(buf, value)
examT_q3(buf, value)
examT_q3(a, b)
examT_q4(value)
examT_q4(first, second)
examT_q4(a, na, b, nb)
~~~

The tests must also assert that q selects the function name, that driverFor never embeds JSON-provided source, and that each emitted path prints "%d %d\\n".

- [ ] **Step 2: Run and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because driverFor and driverStdin are absent.

- [ ] **Step 3: Implement the closed driver registry**

Each registry entry provides validate, declarations/read loop, call expression, snapshot/compare logic, cleanup, stdin encoder, and formatter. Reuse helpers for shared shapes rather than copying complete drivers.

For sentinel_int_array_int, stdin contains the logical length and logical values. The C driver allocates through the next doubling probe and fills every slot after the logical data with INT_MIN, matching the spec's trailing sentinel/padding assumption without an out-of-bounds probe.

For matrix_rows_int, stdin contains m and cols, the driver rejects a runtime cols value different from macro N, then allocates int mat[m][N].

For string drivers, allocate at least 2 * input length + 2 bytes so in-place RLE output has safe capacity. Preserve a snapshot only when mutation is forbidden.

- [ ] **Step 4: Add failing mutation-policy tests**

Assert forbidden drivers emit snapshot comparison and allowed drivers print mutation bit 0 without rejecting a legitimate modification. Assert a forbidden two-string driver snapshots both strings.

- [ ] **Step 5: Run and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: the new mutation assertions fail.

- [ ] **Step 6: Implement mutation-policy generation**

Mutation detection is data, not a hard-coded q3 rule. Every driver with mutable arrays or strings supports forbidden snapshots. The browser and verifier will both treat a returned mutation bit of 1 as a failed case when the policy is forbidden.

- [ ] **Step 7: Run and verify GREEN**

Run: node --test src/driver-core.test.mjs

Expected: all driver ids and mutation policies pass.

- [ ] **Step 8: Commit**

~~~powershell
git add src/driver-core.js src/driver-core.test.mjs
git commit -m "Generate C drivers for all exam signatures"
~~~

### Task 4: Migrate Offline Verification

**Files:**
- Modify: src/verify.mjs
- Modify: src/driver-core.test.mjs

**Interfaces:**
- Consumes: ExamDrivers loaded from driver-core.js and normalized question records.
- Preserves: spliceSolution, gcc 13.2 endpoint, one compile per question, and VERIFY OK/FAILED exit behavior.

- [ ] **Step 1: Write a failing source-contract test**

~~~js
const verify = fs.readFileSync(new URL("./verify.mjs", import.meta.url), "utf8");
assert.match(verify, /driver-core\.js/);
assert.doesNotMatch(verify, /function driverFor/);
assert.doesNotMatch(verify, /function driverStdin/);
~~~

- [ ] **Step 2: Run and verify RED**

Run: node --test src/driver-core.test.mjs

Expected: FAIL because verify.mjs still owns hard-coded drivers.

- [ ] **Step 3: Replace verifier-local driver logic**

Load the shared core with the same trusted-local-file pattern used for skeletons. Normalize with {requireMinimum:true}. For each q, use question.cases, ExamDrivers.driverFor(q, question, cases), and ExamDrivers.driverStdin(question, cases). Count a case as failed when result differs or mutation is forbidden and token two equals 1. Print manifest errors before network calls.

- [ ] **Step 4: Run unit tests and syntax checks**

Run:

~~~powershell
node --test src/driver-core.test.mjs
node --check src/driver-core.js
node --check src/verify.mjs
~~~

Expected: all exit 0.

- [ ] **Step 5: Run the real exam-001 verifier**

Run: node src/verify.mjs

Expected: VERIFY OK and every existing exam-001 case passes. This step requires network access.

- [ ] **Step 6: Commit**

~~~powershell
git add src/verify.mjs src/driver-core.test.mjs
git commit -m "Use generic drivers in exam verification"
~~~

### Task 5: Integrate the Shared Core into Built Pages

**Files:**
- Modify: src/_template.html
- Modify: src/build.mjs
- Create: src/build.test.mjs

**Interfaces:**
- buildPage({number, sourceDir, outputRoot}) returns the output path and rendered HTML.
- Template placeholder: __DRIVER_CORE__.

- [ ] **Step 1: Write the failing build regression**

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {buildPage} from "./build.mjs";

test("injects the shared driver core and leaves no placeholders", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-"));
  const result = buildPage({number:"1", outputRoot:root});
  assert.match(result.html, /const ExamDrivers/);
  assert.doesNotMatch(result.html, /__[A-Z0-9_]+__/);
  assert.ok(fs.existsSync(path.join(root, "1", "index.html")));
});
~~~

- [ ] **Step 2: Run and verify RED**

Run: node --test src/build.test.mjs

Expected: FAIL because build.mjs exports no buildPage and injects no driver core.

- [ ] **Step 3: Refactor build.mjs and add the placeholder**

Move current splice logic into exported buildPage. Add .replace("__DRIVER_CORE__", read("driver-core.js")). Reject absent placeholders before replacement and any remaining /__[A-Z0-9_]+__/ after replacement. Retain CLI behavior under an import.meta.url/process.argv[1] guard. Add __DRIVER_CORE__ immediately after "use strict" and before manifest normalization in _template.html.

- [ ] **Step 4: Run and verify GREEN**

Run: node --test src/build.test.mjs

Expected: the injection and unresolved-placeholder test passes.

- [ ] **Step 5: Write a failing browser source-contract test**

Assert _template.html:

~~~js
const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
assert.match(template, /ExamDrivers\.normalizeManifest/);
assert.match(template, /ExamDrivers\.driverFor/);
assert.match(template, /ExamDrivers\.driverStdin/);
assert.match(template, /ExamDrivers\.formatArgs/);
assert.doesNotMatch(template, /function driverFor/);
assert.doesNotMatch(template, /if\(q === "q3"\).*mutated/s);
~~~

- [ ] **Step 6: Run and verify RED**

Run: node --test src/build.test.mjs

Expected: FAIL because the browser still has exam-001-only logic.

- [ ] **Step 7: Migrate browser manifest and test execution**

Normalize the embedded JSON once:

~~~js
const TEST_MANIFEST = ExamDrivers.normalizeManifest(
  JSON.parse(document.getElementById("exam-tests").textContent)
);
const QUESTION_TESTS = TEST_MANIFEST.questions;
const BASE_TESTS = Object.fromEntries(
  ["q2","q3","q4"].map(q => [q, QUESTION_TESTS[q].cases])
);
~~~

Use QUESTION_TESTS[q] for the driver kind and mutation policy. Replace fmtArgs with ExamDrivers.formatArgs. Validate custom cases with ExamDrivers.validateCases using the active question's driver. Replace the q3-only mutation warning with a failure tied to question.mutation === "forbidden".

- [ ] **Step 8: Run all local tests and syntax checks**

Run:

~~~powershell
node --test src/driver-core.test.mjs src/build.test.mjs
node --check src/driver-core.js
node --check src/verify.mjs
node --check src/build.mjs
~~~

Expected: all tests pass and checks exit 0.

- [ ] **Step 9: Rebuild exam 001 and verify behavior**

Run:

~~~powershell
node src/build.mjs 1
node src/verify.mjs
~~~

Expected: build reports /1/index.html; verifier reports VERIFY OK. Confirm the built page contains exam-tests, godbolt.org, and no unresolved placeholder.

- [ ] **Step 10: Commit**

~~~powershell
git add src/_template.html src/build.mjs src/build.test.mjs 1/index.html
git commit -m "Use generic drivers in exam pages"
~~~

### Task 6: Document and Review the Driver Contract

**Files:**
- Modify: README.md
- Modify: docs/superpowers/specs/2026-08-27-generic-exam-driver-design.md only if implementation names differ.

- [ ] **Step 1: Document the version-2 manifest**

Include the exact question object shape, all eleven driver ids with required args, mutation semantics, legacy compatibility, and the rule that artifacts cannot contain arbitrary C driver source.

- [ ] **Step 2: Run documentation/source consistency assertions**

Add a test that extracts DRIVER_IDS from ExamDrivers and asserts every id appears in README.md.

Run: node --test src/driver-core.test.mjs src/build.test.mjs

Expected: all tests pass.

- [ ] **Step 3: Run the complete infrastructure gate**

Run:

~~~powershell
node --test src/driver-core.test.mjs src/build.test.mjs
node --check src/driver-core.js
node --check src/verify.mjs
node --check src/build.mjs
node src/verify.mjs
node src/build.mjs 1
~~~

Expected: 0 test failures, 0 syntax errors, VERIFY OK, and a successful exam-001 build.

- [ ] **Step 4: Perform anti-pattern and quality review**

Reject arbitrary source fields, eval of manifest data, duplicated driver registries, q-specific signature branching outside the registry, unresolved placeholders, and a changed exam-001 public test shape.

- [ ] **Step 5: Commit**

~~~powershell
git add README.md src docs/superpowers/specs/2026-08-27-generic-exam-driver-design.md 1/index.html
git commit -m "Document generic exam driver manifests"
~~~
