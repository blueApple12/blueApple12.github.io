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

test("browser test runner delegates to the shared driver contract", () => {
  const template = fs.readFileSync(new URL("./_template.html", import.meta.url), "utf8");
  assert.match(template, /ExamDrivers\.normalizeManifest/);
  assert.match(template, /ExamDrivers\.driverFor/);
  assert.match(template, /ExamDrivers\.driverStdin/);
  assert.match(template, /ExamDrivers\.formatArgs/);
  assert.doesNotMatch(template, /function driverFor/);
  assert.doesNotMatch(template, /if\(q === "q3"\).*mutated/s);
});
