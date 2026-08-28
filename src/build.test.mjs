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
  const literal = "<p>$& $$ $` $'</p>";
  fs.writeFileSync(path.join(sourceDir, "_paper.html"), literal);

  const result = buildPage({number:"1", sourceDir, outputRoot:fs.mkdtempSync(path.join(os.tmpdir(), "exam-build-output-"))});
  assert.ok(result.html.includes(literal));
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
