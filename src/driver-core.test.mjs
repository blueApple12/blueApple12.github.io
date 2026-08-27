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

test("generates closed C drivers with the exact selected calls", () => {
  const core = loadCore();
  const examples = [
    ["int_array_n_int", "q2", {arr:[7], n:1, value:3}, "examT_q2(arr, n, value)"],
    ["int_array_n", "q2", {arr:[7], n:1}, "examT_q2(arr, n)"],
    ["sentinel_int_array_int", "q2", {arr:[7], value:3}, "examT_q2(arr, value)"],
    ["matrix_rows_int", "q2", {mat:[[7]], m:1, cols:1, value:3}, "examT_q2(mat, m, value)"],
    ["string_only", "q3", {s:"abc"}, "examT_q3(buf)"],
    ["string_int", "q3", {s:"abc", value:3}, "examT_q3(buf, value)"],
    ["string_char", "q3", {s:"abc", value:"x"}, "examT_q3(buf, value)"],
    ["two_strings", "q3", {a:"abc", b:"def"}, "examT_q3(a, b)"],
    ["int_only", "q4", {value:3}, "examT_q4(value)"],
    ["two_ints", "q4", {first:3, second:4}, "examT_q4(first, second)"],
    ["two_int_arrays", "q4", {a:[3], na:1, b:[4], nb:1}, "examT_q4(a, na, b, nb)"]
  ];

  for (const [driver, q, args, call] of examples) {
    const question = {driver, mutation:"allowed"};
    const cases = [{name:"one", args, expect:"0"}];
    const source = core.driverFor(q, question, cases);
    assert.match(source, new RegExp(call.replace(/[()]/g, "\\$&")), driver);
    assert.match(source, /printf\("%d %d\\n", result, mutated\);/, driver);
    assert.match(core.driverStdin(question, cases), /^1\n/, driver);
  }

  const source = core.driverFor("q4", {driver:"int_only", mutation:"allowed"}, [{
    name:"no-source", args:{value:1, c_source:"JSON_C_INJECTION"}, expect:"0"
  }]);
  assert.match(source, /examT_q4\(value\)/);
  assert.doesNotMatch(source, /JSON_C_INJECTION/);
  assert.throws(
    () => core.driverFor("q2; JSON_C_INJECTION", {driver:"int_only", mutation:"allowed"}, []),
    /question/
  );
});

test("generates safe input layouts and mutation checks from policy data", () => {
  const core = loadCore();
  const source = (q, driver, mutation, args) => core.driverFor(q, {driver, mutation}, [{name:"one", args, expect:"0"}]);

  const sentinelArgs = {arr:[4,5], value:6};
  const sentinel = source("q2", "sentinel_int_array_int", "forbidden", sentinelArgs);
  assert.match(sentinel, /size_t probe=1; while\(probe<=\(size_t\)n\) probe\*=2U;/);
  assert.match(sentinel, /malloc\(sizeof\(\*arr\)\*\(probe\+1U\)\)/);
  assert.match(sentinel, /for\(size_t i=\(size_t\)n;i<=probe;i\+\+\) arr\[i\]=INT_MIN;/);
  assert.equal(core.driverStdin({driver:"sentinel_int_array_int", mutation:"forbidden"}, [{name:"one", args:sentinelArgs, expect:"0"}]), "1\n2\n4\n5\n6\n");

  const matrix = source("q2", "matrix_rows_int", "forbidden", {mat:[[1,2]], m:1, cols:2, value:3});
  assert.match(matrix, /cols!=N/);
  assert.match(matrix, /int mat\[m\]\[N\]/);

  const string = source("q3", "string_only", "forbidden", {s:"a b"});
  assert.match(string, /size_t buf_capacity=2U\*\(size_t\)len\+2U;/);
  assert.match(string, /byte<1 \|\| byte>255/);
  assert.equal(core.driverStdin({driver:"string_only", mutation:"forbidden"}, [{name:"one", args:{s:"a b"}, expect:"0"}]), "1\n3\n97\n32\n98\n");

  const mutable = [
    ["q2", "int_array_n_int", {arr:[1], n:1, value:2}, /arr_before/],
    ["q2", "int_array_n", {arr:[1], n:1}, /arr_before/],
    ["q2", "sentinel_int_array_int", {arr:[1], value:2}, /arr_before/],
    ["q2", "matrix_rows_int", {mat:[[1]], m:1, cols:1, value:2}, /mat_before/, false],
    ["q3", "string_only", {s:"a"}, /buf_before/],
    ["q3", "string_int", {s:"a", value:2}, /buf_before/],
    ["q3", "string_char", {s:"a", value:"x"}, /buf_before/],
    ["q3", "two_strings", {a:"a", b:"b"}, /a_before[\s\S]*b_before/],
    ["q4", "two_int_arrays", {a:[1], na:1, b:[2], nb:1}, /a_before[\s\S]*b_before/]
  ];
  for (const [q, driver, args, snapshot, heapAllocated = true] of mutable) {
    const forbidden = source(q, driver, "forbidden", args);
    assert.match(forbidden, snapshot, `${driver} snapshot`);
    assert.match(forbidden, /memcmp\(/, `${driver} comparison`);
    if (heapAllocated) assert.match(forbidden, /free\(/, `${driver} cleanup`);

    const allowed = source(q, driver, "allowed", args);
    assert.match(allowed, /int mutated=0;/, `${driver} allowed marker`);
    assert.doesNotMatch(allowed, snapshot, `${driver} allowed does not snapshot`);
    assert.doesNotMatch(allowed, /memcmp\(/, `${driver} allowed accepts modifications`);
  }

  assert.throws(
    () => core.driverStdin({driver:"int_only", mutation:"allowed"}, [{name:"evil", args:{value:1, c_source:"JSON_C_INJECTION"}, expect:"0"}]),
    /unexpected.*c_source/
  );
});

test("pads a length-five sentinel array through its next doubling probe", () => {
  const core = loadCore();
  const source = core.driverFor("q2", {driver:"sentinel_int_array_int", mutation:"forbidden"}, [{
    name:"length-five", args:{arr:[1,2,3,4,5], value:3}, expect:"0"
  }]);
  assert.match(source, /size_t probe=1; while\(probe<=\(size_t\)n\) probe\*=2U;/);
  assert.match(source, /malloc\(sizeof\(\*arr\)\*\(probe\+1U\)\)/);
  assert.match(source, /for\(size_t i=\(size_t\)n;i<=probe;i\+\+\) arr\[i\]=INT_MIN;/);
});
