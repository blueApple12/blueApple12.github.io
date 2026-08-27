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
      q2: {driver:"int_array_n_int", mutation:"allowed", cases:[{name:"t01", args:{arr:[1], n:1, value:1}, expect:"0"}]},
      q3: {driver:"string_int", mutation:"forbidden", cases:[{name:"t01", args:{s:"aa", value:1}, expect:"2"}]},
      q4: {driver:"int_array_n_int", mutation:"allowed", cases:[{name:"t01", args:{arr:[1], n:1, value:1}, expect:"1"}]}
    }
  });
  assert.deepEqual(raw.q2[0].args, {arr:[1], n:1, x:1});
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

test("requires all three questions, own properties, and rejects extra keys", () => {
  const core = loadCore();
  assert.throws(() => core.normalizeManifest({q2:[], q3:[]}), /q4/);
  assert.throws(() => core.normalizeManifest({q2:[], q3:[], q4:[], q5:[]}), /question/);
  assert.throws(() => core.normalizeManifest({version:2, questions:{q2:{}, q3:{}, q4:{}, q5:{}}}), /question/);

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
  const raw = {q2:[], q3:[], q4:[]};
  for (const q of ["q2", "q3", "q4"]) {
    for (let i = 0; i < 11; i++) raw[q].push({name:`t${i}`, args:{}, expect:"0"});
  }
  assert.throws(() => core.normalizeManifest(raw, {requireMinimum:true}), /q2.*12/);
  raw.q2.push({name:"t11", args:{}, expect:"0"});
  assert.throws(() => core.normalizeManifest(raw, {requireMinimum:true}), /q3.*12/);
});

test("validates every typed driver schema and returns defensive copies", () => {
  const core = loadCore();
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
    const copy = core.validateArgs(driver, args);
    assert.deepEqual(copy, args, driver);
    assert.notStrictEqual(copy, args, driver);
  }

  const invalid = [
    ["int_array_n_int", {arr:[1], n:2, value:0}, /length/],
    ["int_array_n_int", {arr:[1], n:1, value:"0"}, /32-bit/],
    ["int_array_n", {arr:[1], n:1, extra:0}, /unexpected.*extra/],
    ["int_array_n", {arr:"1", n:1}, /array/],
    ["sentinel_int_array_int", {arr:[1, -2147483648], value:0}, /INT_MIN/],
    ["sentinel_int_array_int", {arr:"1", value:0}, /array/],
    ["matrix_rows_int", {mat:[[1],[2,3]], m:2, cols:1, value:0}, /rectangular/],
    ["matrix_rows_int", {mat:[[1]], m:2, cols:1, value:0}, /rows.*m|m.*rows/],
    ["string_only", {s:"a\0b"}, /NUL/],
    ["string_only", {s:1}, /string/],
    ["string_int", {s:"a", value:2147483648}, /32-bit/],
    ["string_int", {s:"a\0", value:1}, /NUL/],
    ["string_char", {s:"abc", value:"xy"}, /single character/],
    ["string_char", {s:"a\0", value:"x"}, /NUL/],
    ["two_strings", {a:"abc", b:3}, /string/],
    ["two_strings", {a:"a\0", b:"b"}, /NUL/],
    ["int_only", {value:1.5}, /32-bit/],
    ["int_only", {}, /missing.*value/],
    ["two_ints", {first:7}, /second/],
    ["two_ints", {first:2147483648, second:3}, /32-bit/],
    ["two_int_arrays", {a:[1], na:1, b:[2], nb:2}, /length/],
    ["two_int_arrays", {a:["1"], na:1, b:[2], nb:1}, /32-bit/]
  ];
  for (const [driver, args, message] of invalid) {
    assert.throws(() => core.validateArgs(driver, args), message, driver);
  }

  const result = core.validateArgs("int_array_n_int", valid.int_array_n_int);
  result.arr[0] = 99;
  assert.equal(valid.int_array_n_int.arr[0], 1);
});

test("serializes C strings/chars and formats typed arguments", () => {
  const core = loadCore();
  assert.equal(core.cString('a"b\\c\n'), '"a\\"b\\\\c\\n"');
  assert.equal(core.cChar("'"), "'\\''");
  assert.equal(core.cString("\r\t\x01"), '"\\r\\t\\001"');
  assert.match(core.formatArgs("two_strings", {a:"abc", b:"abd"}), /a=/);
  assert.match(core.formatArgs("two_int_arrays", {a:[1],na:1,b:[2],nb:1}), /nb=1/);
  assert.match(core.formatArgs("string_only", {s:"abcdefghijk",}), /len=11/);
});

test("hardens legacy argument aliases and literal/display boundaries", () => {
  const core = loadCore();
  assert.throws(
    () => core.validateArgs("sentinel_int_array_int", {arr:[1], value:-2147483648}),
    /INT_MIN/
  );
  assert.equal(core.cString("\x01A"), '"\\001A"');
  assert.throws(() => core.cChar("é"), /single-byte/);

  const long = "x".repeat(10000);
  const formatted = core.formatArgs("string_only", {s:long});
  assert.match(formatted, /len=10000/);
  assert.ok(formatted.length < 500, `preview was not bounded: ${formatted.length}`);
});
