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

test("normalizes and copies a valid version-2 manifest", () => {
  const core = loadCore();
  const raw = {
    version: 2,
    questions: {
      q2: {driver:"int_array_n", mutation:"allowed", cases:[{name:"a", args:{arr:[1], n:1}, expect:"2"}]},
      q3: {driver:"string_only", mutation:"forbidden", cases:[{name:"b", args:{s:"x"}, expect:"0"}]},
      q4: {driver:"two_int_arrays", mutation:"allowed", cases:[{name:"c", args:{a:[1], b:[2]}, expect:"-1"}]}
    }
  };
  const normalized = core.normalizeManifest(raw);
  assert.deepEqual(normalized, raw);
  assert.notStrictEqual(normalized, raw);
  assert.notStrictEqual(normalized.questions, raw.questions);
  assert.notStrictEqual(normalized.questions.q2, raw.questions.q2);
  assert.notStrictEqual(normalized.questions.q2.cases, raw.questions.q2.cases);
});

test("rejects malformed manifest structure and policies", () => {
  const core = loadCore();
  const invalid = [
    [{version:3, questions:{}}, /version/],
    [{version:2, questions:{}}, /q2/],
    [{version:2, questions:{q2:{driver:"c_source", mutation:"allowed", cases:[]}}}, /driver/],
    [{version:2, questions:{q2:{driver:"int", mutation:"sometimes", cases:[]}}}, /mutation/]
  ];
  for (const [raw, message] of invalid) {
    assert.throws(() => core.normalizeManifest(raw), message);
  }
});

test("requires all three questions and rejects extra question keys", () => {
  const core = loadCore();
  assert.throws(() => core.normalizeManifest({q2:[], q3:[]}), /q4/);
  assert.throws(() => core.normalizeManifest({q2:[], q3:[], q4:[], q5:[]}), /question/);
  assert.throws(() => core.normalizeManifest({version:2, questions:{q2:{}, q3:{}, q4:{}, q5:{}}}), /question/);
});

test("rejects inherited question definitions", () => {
  const core = loadCore();
  const inherited = Object.create({q2:[], q3:[], q4:[]});
  assert.throws(() => core.normalizeManifest(inherited), /q2/);
});

test("rejects a non-array cases value in a version-2 question", () => {
  const core = loadCore();
  const raw = {
    version: 2,
    questions: {
      q2: {driver:"int_array_n", mutation:"allowed", cases:{name:"a"}},
      q3: {driver:"string_only", mutation:"forbidden", cases:[]},
      q4: {driver:"int_only", mutation:"allowed", cases:[]}
    }
  };
  assert.throws(() => core.normalizeManifest(raw), /q2/);
});

test("requires case arrays, unique nonempty names, object args, and decimal expects", () => {
  const core = loadCore();
  const base = () => ({
    q2: [{name:"a", args:{arr:[]}, expect:"0"}],
    q3: [{name:"a", args:{s:""}, expect:"0"}],
    q4: [{name:"a", args:{arr:[]}, expect:"0"}]
  });

  const noCases = base();
  noCases.q2 = {...noCases.q2[0], cases: []};
  assert.throws(() => core.normalizeManifest(noCases), /q2/);

  const duplicate = base();
  duplicate.q2.push({name:"a", args:{arr:[]}, expect:"1"});
  assert.throws(() => core.normalizeManifest(duplicate), /q2.*a/);

  for (const name of ["", " ", null]) {
    const raw = base();
    raw.q2[0].name = name;
    assert.throws(() => core.normalizeManifest(raw), /q2/);
  }

  const nonObjectArgs = base();
  nonObjectArgs.q2[0].args = null;
  assert.throws(() => core.normalizeManifest(nonObjectArgs), /q2.*a/);

  for (const expect of [0, "", "1.5", "abc", " 1", "+1"]) {
    const raw = base();
    raw.q2[0].expect = expect;
    assert.throws(() => core.normalizeManifest(raw), /q2.*a/);
  }
});

test("requires twelve cases per question when requested", () => {
  const core = loadCore();
  const raw = {
    q2: [],
    q3: [],
    q4: []
  };
  for (const q of ["q2", "q3", "q4"]) {
    for (let i = 0; i < 11; i++) raw[q].push({name:`t${i}`, args:{}, expect:"0"});
  }
  assert.throws(() => core.normalizeManifest(raw, {requireMinimum:true}), /q2.*12/);
  raw.q2.push({name:"t11", args:{}, expect:"0"});
  assert.throws(() => core.normalizeManifest(raw, {requireMinimum:true}), /q3.*12/);
});
