import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildPage} from "./build.mjs";

function loadTemplateHelper(name, bindings = {}) {
  const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
  const block = template.match(/\/\* BEGIN CUSTOM CASE HELPERS \*\/([\s\S]*?)\/\* END CUSTOM CASE HELPERS \*\//);
  assert.ok(block, "custom-case helper block is missing");
  const keys = Object.keys(bindings);
  return new Function(...keys, `${block[1]}\nreturn ${name};`)(...keys.map(key => bindings[key]));
}

test("injects the shared driver core and leaves no placeholders", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-"));
  const result = buildPage({number:"1", outputRoot:root});
  assert.match(result.html, /const ExamDrivers/);
  assert.doesNotMatch(result.html, /__[A-Z0-9_]+__/);
  assert.ok(fs.existsSync(path.join(root, "1", "index.html")));
});

test("injects fragment text literally when it contains replacement tokens", () => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-source-"));
  fs.cpSync(path.dirname(fileURLToPath(import.meta.url)), sourceDir, {recursive:true});
  const literal = "<p>__SKELETONS__ $& $$ $` $'</p>";
  fs.writeFileSync(path.join(sourceDir, "_paper.html"), literal);

  const result = buildPage({number:"1", sourceDir, outputRoot:fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-output-"))});
  assert.ok(result.html.includes(literal));
});

test("validates the template placeholder set and count before injection", () => {
  const createSource = () => {
    const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-source-"));
    fs.cpSync(path.dirname(fileURLToPath(import.meta.url)), sourceDir, {recursive:true});
    return sourceDir;
  };

  const unexpectedSource = createSource();
  const unexpectedTemplate = path.join(unexpectedSource, "_template.html");
  fs.writeFileSync(unexpectedTemplate, fs.readFileSync(unexpectedTemplate, "utf8") + "__UNEXPECTED__");
  assert.throws(
    () => buildPage({number:"1", sourceDir:unexpectedSource, outputRoot:fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-output-"))}),
    /unexpected placeholder/
  );

  const duplicateSource = createSource();
  const duplicateTemplate = path.join(duplicateSource, "_template.html");
  fs.writeFileSync(duplicateTemplate, fs.readFileSync(duplicateTemplate, "utf8").replace("__PAPER__", "__PAPER____PAPER__"));
  assert.throws(
    () => buildPage({number:"1", sourceDir:duplicateSource, outputRoot:fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-output-"))}),
    /placeholder count/
  );
});

test("builds only into an unpadded positive-decimal page child", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-root-"));
  const sentinel = path.join(root, "index.html");
  const escaped = path.join(path.dirname(root), path.basename(root) + "-escaped");
  fs.writeFileSync(sentinel, "must not be overwritten");

  const result = buildPage({number:"42", outputRoot:root});
  assert.equal(result.outputPath, path.join(root, "42", "index.html"));
  assert.equal(path.dirname(path.dirname(result.outputPath)), root);

  for (const number of ["0", "01", ".", "..", "1/2", "1\\2", escaped]) {
    assert.throws(() => buildPage({number, outputRoot:root}), /page number/);
  }
  assert.equal(fs.readFileSync(sentinel, "utf8"), "must not be overwritten");
  assert.ok(!fs.existsSync(escaped));
});

test("escapes test-payload less-than signs and recovers their original strings", () => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-source-"));
  fs.cpSync(path.dirname(fileURLToPath(import.meta.url)), sourceDir, {recursive:true});
  const original = "literal </script> test data";
  const testsPath = path.join(sourceDir, "_tests.json");
  const tests = JSON.parse(fs.readFileSync(testsPath, "utf8"));
  tests.q3[0].args.s = original;
  fs.writeFileSync(testsPath, JSON.stringify(tests));

  const {html} = buildPage({number:"1", sourceDir, outputRoot:fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-output-"))});
  const payload = html.match(/<script id="exam-tests" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.match(payload, /\\u003c\/script>/);
  assert.equal(JSON.parse(payload).q3[0].args.s, original);
});

test("browser test runner delegates to the shared driver contract", () => {
  const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
  assert.match(template, /ExamDrivers\.normalizeManifest/);
  assert.match(template, /ExamDrivers\.driverFor/);
  assert.match(template, /ExamDrivers\.driverStdin/);
  assert.match(template, /ExamDrivers\.formatArgs/);
  assert.doesNotMatch(template, /function driverFor/);
  assert.doesNotMatch(template, /if\(q === "q3"\).*mutated/s);
});

test("browser canonicalizes legacy custom aliases before strict validation", () => {
  const canonicalize = loadTemplateHelper("canonicalizeLegacyCustomCases");
  const core = new Function(
    fs.readFileSync(new URL("./driver-core.js", import.meta.url), "utf8") + "\nreturn ExamDrivers;"
  )();
  const cases = [
    ["q2", "x", {arr:[1,2], n:2, x:3}, "int_array_n_int"],
    ["q3", "k", {s:"aabb", k:2}, "string_int"],
    ["q4", "k", {arr:[1], n:1, k:4}, "int_array_n_int"]
  ];

  for (const [question, alias, args, driver] of cases) {
    const original = [{name:"legacy", args:{...args}, expect:"0"}];
    const canonical = canonicalize(question, original);
    assert.equal(canonical[0].args.value, args[alias], question);
    assert.ok(!(alias in canonical[0].args), question);
    assert.deepEqual(original[0].args, args, question);
    assert.doesNotThrow(() => core.validateCases({driver, mutation:"allowed"}, canonical), question);
  }

  const conflicts = [
    ["q2", "x", {arr:[1,2], n:2, value:3, x:999}, "int_array_n_int"],
    ["q3", "k", {s:"aabb", value:3, k:999}, "string_int"],
    ["q4", "k", {arr:[1], n:1, value:3, k:999}, "int_array_n_int"]
  ];
  for (const [question, alias, args, driver] of conflicts) {
    const canonical = canonicalize(question, [{name:"conflict", args, expect:"0"}]);
    assert.equal(canonical[0].args[alias], 999, question);
    assert.throws(
      () => core.validateCases({driver, mutation:"allowed"}, canonical),
      new RegExp(`unexpected.*${alias}`),
      question
    );
  }
});

test("browser rejects duplicate names across custom-test add batches", () => {
  const core = new Function(
    fs.readFileSync(new URL("./driver-core.js", import.meta.url), "utf8") + "\nreturn ExamDrivers;"
  )();
  const question = {driver:"int_only", mutation:"allowed"};
  const validateCases = (_q, cases) => core.validateCases(question, cases);
  const merge = loadTemplateHelper("mergeCustomCases", {validateCases});
  const existing = [{name:"same", args:{value:1}, expect:"1"}];
  const incoming = [{name:"same", args:{value:2}, expect:"2"}];

  assert.throws(() => merge("q2", existing, incoming), /unique/);
  assert.deepEqual(
    merge("q2", existing, [{name:"other", args:{value:2}, expect:"2"}]),
    [...existing, {name:"other", args:{value:2}, expect:"2"}]
  );

  const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
  assert.match(template, /CUSTOM\[q\] = mode === "add" \? mergeCustomCases\(q, effTests\(q\), cs\) : cs;/);
});

test("browser custom-case guide is derived from a valid base case", () => {
  const BASE_TESTS = {
    q2: [{name:"base-q2", args:{arr:[1,2], n:2, value:3}, expect:"1"}],
    q3: [{name:"base-q3", args:{s:"abba", value:2}, expect:"4"}],
    q4: [{name:"base-q4", args:{value:7}, expect:"7"}]
  };
  const QUESTION_TESTS = {q2:{}, q3:{}, q4:{}};
  const validated = [];
  const ExamDrivers = {
    validateCases(question, cases) {
      validated.push([question, cases]);
      return cases;
    }
  };
  const exampleFor = loadTemplateHelper("customCaseExample", {BASE_TESTS, QUESTION_TESTS, ExamDrivers});

  for (const q of ["q2", "q3", "q4"]) {
    assert.deepEqual(JSON.parse(exampleFor(q)), [BASE_TESTS[q][0]], q);
  }
  assert.deepEqual(validated.map(([question]) => question), [QUESTION_TESTS.q2, QUESTION_TESTS.q3, QUESTION_TESTS.q4]);

  const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
  assert.match(template, /const caseExample = customCaseExample\(q\);/);
  assert.doesNotMatch(template, /CASE_SHAPE/);
});
