"use strict";
const ExamDrivers = (() => {
  const IDS = ["q2", "q3", "q4"];
  const LEGACY = {
    q2: {driver:"int_array_n_int", mutation:"allowed"},
    q3: {driver:"string_int", mutation:"forbidden"},
    q4: {driver:"int_array_n_int", mutation:"allowed"}
  };
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

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (isObject(value)) {
      const result = {};
      for (const key of Object.keys(value)) result[key] = copy(value[key]);
      return result;
    }
    return value;
  }

  function invalid(question, message, caseName) {
    const suffix = caseName === undefined ? "" : ` case ${String(caseName || "<unknown>")}`;
    throw new Error(`Invalid manifest ${question}${suffix}: ${message}`);
  }

  function rejectExtraQuestions(questions) {
    for (const key of Object.keys(questions)) {
      if (!IDS.includes(key)) throw new Error(`Invalid manifest: unexpected question ${key}`);
    }
  }

  function normalizeQuestion(question, source, options) {
    if (!isObject(source)) invalid(question, "question definition must be an object");
    if (typeof source.mutation !== "string" || !MUTATION_POLICIES.has(source.mutation)) {
      invalid(question, `unrecognized mutation policy ${String(source.mutation)}`);
    }
    if (typeof source.driver !== "string" || !DRIVER_IDS.has(source.driver)) {
      invalid(question, `unrecognized driver ${String(source.driver)}`);
    }
    if (!Array.isArray(source.cases)) invalid(question, "cases must be an array");
    if (options.requireMinimum && source.cases.length < 12) {
      invalid(question, `at least 12 cases are required (got ${source.cases.length})`);
    }

    const names = new Set();
    const cases = source.cases.map((item) => {
      if (!isObject(item)) invalid(question, "case must be an object");
      const caseName = item.name;
      if (typeof caseName !== "string" || caseName.trim().length === 0) {
        invalid(question, "case name must be a nonempty string", caseName);
      }
      if (names.has(caseName)) invalid(question, "case name must be unique", caseName);
      names.add(caseName);
      if (!isObject(item.args)) invalid(question, "args must be an object", caseName);
      if (typeof item.expect !== "string" || !/^-?\d+$/.test(item.expect)) {
        invalid(question, "expect must be a decimal string", caseName);
      }
      return copy(item);
    });
    return {driver:source.driver, mutation:source.mutation, cases};
  }

  function canonicalizeLegacyCases(question, cases) {
    const alias = question === "q2" ? "x" : "k";
    if (!Array.isArray(cases)) return cases;
    return cases.map((item) => {
      const result = copy(item);
      if (isObject(result) && isObject(result.args) && !Object.prototype.hasOwnProperty.call(result.args, "value") && Object.prototype.hasOwnProperty.call(result.args, alias)) {
        result.args.value = result.args[alias];
        delete result.args[alias];
      }
      return result;
    });
  }

  function normalizeManifest(raw, options = {}) {
    if (!isObject(raw)) throw new Error("Invalid manifest: manifest must be an object");
    const hasVersion = Object.prototype.hasOwnProperty.call(raw, "version");
    let questions;
    if (hasVersion) {
      if (raw.version !== 2) throw new Error(`Invalid manifest version ${String(raw.version)}`);
      if (!isObject(raw.questions)) throw new Error("Invalid manifest: questions must be an object");
      questions = raw.questions;
    } else {
      questions = raw;
    }
    rejectExtraQuestions(questions);

    const normalizedQuestions = {};
    for (const id of IDS) {
      if (!Object.prototype.hasOwnProperty.call(questions, id)) {
        throw new Error(`Invalid manifest: missing question ${id}`);
      }
      const source = hasVersion ? questions[id] : {...LEGACY[id], cases:canonicalizeLegacyCases(id, questions[id])};
      normalizedQuestions[id] = normalizeQuestion(id, source, options);
    }
    return {version:2, questions:normalizedQuestions};
  }

  const INT_MIN = -2147483648;
  const INT_MAX = 2147483647;
  const ARGUMENT_KEYS = {
    int_array_n_int: ["arr", "n", "value"],
    int_array_n: ["arr", "n"],
    sentinel_int_array_int: ["arr", "value"],
    matrix_rows_int: ["mat", "m", "cols", "value"],
    string_only: ["s"],
    string_int: ["s", "value"],
    string_char: ["s", "value"],
    two_strings: ["a", "b"],
    int_only: ["value"],
    two_ints: ["first", "second"],
    two_int_arrays: ["a", "na", "b", "nb"]
  };

  function argumentError(driver, message) {
    throw new Error(`Invalid arguments for ${driver}: ${message}`);
  }

  function requireArgumentObject(driver, args) {
    if (!isObject(args)) argumentError(driver, "arguments must be an object");
    const keys = ARGUMENT_KEYS[driver];
    if (!keys) argumentError(driver, "unrecognized driver");
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(args, key)) {
        argumentError(driver, `missing argument ${key}`);
      }
    }
    const allowed = new Set(keys);
    for (const key of Object.keys(args)) {
      if (!allowed.has(key)) argumentError(driver, `unexpected argument ${key}`);
    }
    return keys;
  }

  function validateInteger(driver, value, name) {
    if (!Number.isSafeInteger(value) || value < INT_MIN || value > INT_MAX) {
      argumentError(driver, `${name} must be a signed 32-bit integer`);
    }
    return value;
  }

  function validateString(driver, value, name) {
    if (typeof value !== "string") argumentError(driver, `${name} must be a string`);
    if (value.includes("\0")) argumentError(driver, `${name} must not contain NUL`);
    return value;
  }

  function validateChar(driver, value, name) {
    validateString(driver, value, name);
    if (Array.from(value).length !== 1) {
      argumentError(driver, `${name} must be a single character`);
    }
    return value;
  }

  function validateIntegerArray(driver, value, name, options = {}) {
    if (!Array.isArray(value)) argumentError(driver, `${name} must be an array`);
    const result = value.map((item, index) => {
      const number = validateInteger(driver, item, `${name}[${index}]`);
      if (options.rejectSentinel && number === INT_MIN) {
        argumentError(driver, `${name}[${index}] must not be INT_MIN`);
      }
      return number;
    });
    return result;
  }

  function validateArgs(driver, args) {
    requireArgumentObject(driver, args);
    const result = {};
    if (driver === "int_array_n_int") {
      result.arr = validateIntegerArray(driver, args.arr, "arr");
      result.n = validateInteger(driver, args.n, "n");
      if (result.n !== result.arr.length) argumentError(driver, "n must match arr length");
      result.value = validateInteger(driver, args.value, "value");
    } else if (driver === "int_array_n") {
      result.arr = validateIntegerArray(driver, args.arr, "arr");
      result.n = validateInteger(driver, args.n, "n");
      if (result.n !== result.arr.length) argumentError(driver, "n must match arr length");
    } else if (driver === "sentinel_int_array_int") {
      result.arr = validateIntegerArray(driver, args.arr, "arr", {rejectSentinel:true});
      result.value = validateInteger(driver, args.value, "value");
      if (result.value === INT_MIN) argumentError(driver, "value must not be INT_MIN");
    } else if (driver === "matrix_rows_int") {
      if (!Array.isArray(args.mat)) argumentError(driver, "mat must be an array of rows");
      result.mat = args.mat.map((row, rowIndex) => {
        if (!Array.isArray(row)) argumentError(driver, `mat row ${rowIndex} must be an array`);
        return validateIntegerArray(driver, row, `mat[${rowIndex}]`);
      });
      result.m = validateInteger(driver, args.m, "m");
      result.cols = validateInteger(driver, args.cols, "cols");
      if (result.m !== result.mat.length) argumentError(driver, "m must match matrix rows");
      if (result.m < 1) argumentError(driver, "m must be positive");
      const actualCols = result.mat[0].length;
      if (actualCols < 1) argumentError(driver, "matrix must have at least one column");
      if (!result.mat.every((row) => row.length === actualCols)) {
        argumentError(driver, "matrix must be rectangular");
      }
      if (result.cols !== actualCols) argumentError(driver, "cols must match matrix columns");
      result.value = validateInteger(driver, args.value, "value");
    } else if (driver === "string_only") {
      result.s = validateString(driver, args.s, "s");
    } else if (driver === "string_int") {
      result.s = validateString(driver, args.s, "s");
      result.value = validateInteger(driver, args.value, "value");
    } else if (driver === "string_char") {
      result.s = validateString(driver, args.s, "s");
      result.value = validateChar(driver, args.value, "value");
    } else if (driver === "two_strings") {
      result.a = validateString(driver, args.a, "a");
      result.b = validateString(driver, args.b, "b");
    } else if (driver === "int_only") {
      result.value = validateInteger(driver, args.value, "value");
    } else if (driver === "two_ints") {
      result.first = validateInteger(driver, args.first, "first");
      result.second = validateInteger(driver, args.second, "second");
    } else if (driver === "two_int_arrays") {
      result.a = validateIntegerArray(driver, args.a, "a");
      result.na = validateInteger(driver, args.na, "na");
      result.b = validateIntegerArray(driver, args.b, "b");
      result.nb = validateInteger(driver, args.nb, "nb");
      if (result.na !== result.a.length) argumentError(driver, "na must match a length");
      if (result.nb !== result.b.length) argumentError(driver, "nb must match b length");
    }
    return copy(result);
  }

  function utf8Bytes(value) {
    const bytes = [];
    for (let index = 0; index < value.length; index++) {
      let codePoint = value.codePointAt(index);
      if (codePoint > 0xffff) index++;
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) codePoint = 0xfffd;
      if (codePoint <= 0x7f) bytes.push(codePoint);
      else if (codePoint <= 0x7ff) bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
      else if (codePoint <= 0xffff) bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
      else bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    }
    return bytes;
  }

  function escapedByte(byte, quote) {
    if (byte === 0x5c) return "\\\\";
    if (byte === quote) return `\\${String.fromCharCode(byte)}`;
    if (byte === 0x0a) return "\\n";
    if (byte === 0x0d) return "\\r";
    if (byte === 0x09) return "\\t";
    if (byte === 0x08) return "\\b";
    if (byte === 0x0c) return "\\f";
    if (byte >= 0x20 && byte <= 0x7e) return String.fromCharCode(byte);
    return `\\${byte.toString(8).padStart(3, "0")}`;
  }

  function cString(value) {
    if (typeof value !== "string") throw new TypeError("cString expects a string");
    return `"${utf8Bytes(value).map((byte) => escapedByte(byte, 0x22)).join("")}"`;
  }

  function cChar(value) {
    if (typeof value !== "string" || Array.from(value).length !== 1) {
      throw new TypeError("cChar expects a single character");
    }
    const bytes = utf8Bytes(value);
    if (bytes.length !== 1) throw new TypeError("cChar expects a single-byte character");
    return `'${bytes.map((byte) => escapedByte(byte, 0x27)).join("")}'`;
  }

  function preview(value, limit = 8) {
    if (Array.isArray(value)) {
      const items = value.slice(0, limit).map((item) => Array.isArray(item) ? preview(item, limit) : String(item));
      if (value.length > limit) items.push("...");
      return `[${items.join(", ")}]`;
    }
    return String(value);
  }

  function stringPreview(value, limit = 64) {
    const chars = Array.from(value);
    const clipped = chars.length > limit ? `${chars.slice(0, limit).join("")}...` : value;
    return cString(clipped);
  }

  function formatArgs(driver, args) {
    const validated = validateArgs(driver, args);
    return ARGUMENT_KEYS[driver].map((key) => {
      const value = validated[key];
      if (typeof value === "string") {
        const literal = driver === "string_char" && key === "value" ? cChar(value) : stringPreview(value);
        return `${key}=${literal} (len=${Array.from(value).length})`;
      }
      if (Array.isArray(value)) return `${key}=${preview(value)} (len=${value.length})`;
      return `${key}=${String(value)}`;
    }).join(", ");
  }

  function driverQuestion(question) {
    if (!isObject(question)) throw new Error("Invalid driver question: question must be an object");
    if (typeof question.driver !== "string" || !DRIVER_IDS.has(question.driver)) {
      throw new Error("Invalid driver question: unrecognized driver");
    }
    if (typeof question.mutation !== "string" || !MUTATION_POLICIES.has(question.mutation)) {
      throw new Error("Invalid driver question: unrecognized mutation policy");
    }
    return {driver:question.driver, mutation:question.mutation};
  }

  function selectedFunction(q) {
    if (!IDS.includes(q)) throw new Error(`Invalid driver question ${String(q)}`);
    return `examT_${q}`;
  }

  function readIntegerArray(name, length) {
    return `int* ${name}=NULL; if(${length}>0){ ${name}=(int*)malloc(sizeof(*${name})*(size_t)${length}); if(!${name}) return 1; for(int i=0;i<${length};i++) if(scanf("%d",&${name}[i])!=1) return 1; }`;
  }

  function readString(name, length) {
    return `int ${length}; if(scanf("%d",&${length})!=1 || ${length}<0 || ${length}>(INT_MAX-2)/2) return 1; size_t ${name}_capacity=2U*(size_t)${length}+2U; char* ${name}=(char*)malloc(${name}_capacity); if(!${name}) return 1; for(int i=0;i<${length};i++){ int byte; if(scanf("%d",&byte)!=1 || byte<1 || byte>255) return 1; ${name}[i]=(char)byte; } ${name}[${length}]='\\0';`;
  }

  function sourceFor(read, call, mutation, cleanup = "") {
    return `\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <limits.h>\nint main(void){ int T; if(scanf("%d",&T)!=1 || T<0) return 1; for(int t=0;t<T;t++){ ${read} ${mutation.before} int result=${call}; ${mutation.compare} printf("%d %d\\n", result, mutated); ${mutation.cleanup} ${cleanup} } return 0; }`;
  }

  function stdinString(value) {
    const bytes = utf8Bytes(value);
    return [bytes.length, ...bytes];
  }

  function stdinChar(driver, value) {
    const bytes = utf8Bytes(value);
    if (bytes.length !== 1) argumentError(driver, "value must be a single-byte character");
    return bytes[0];
  }

  function noMutation() {
    return {before:"", compare:"int mutated=0;", cleanup:""};
  }

  function arrayMutation(policy, name, count) {
    if (policy !== "forbidden") return noMutation();
    const before = `${name}_before`;
    const size = `sizeof(*${name})*(size_t)${count}`;
    return {
      before: `int* ${before}=NULL; if(${count}>0){ ${before}=(int*)malloc(${size}); if(!${before}){ free(${name}); return 1; } memcpy(${before},${name},${size}); }`,
      compare: `int mutated=0; if(${count}>0 && memcmp(${before},${name},${size})!=0) mutated=1;`,
      cleanup: `free(${before});`
    };
  }

  function matrixMutation(policy) {
    if (policy !== "forbidden") return noMutation();
    return {
      before: "int mat_before[m][N]; memcpy(mat_before,mat,sizeof mat);",
      compare: "int mutated=memcmp(mat_before,mat,sizeof mat)!=0;",
      cleanup: ""
    };
  }

  function stringMutation(policy, name, length) {
    if (policy !== "forbidden") return noMutation();
    const before = `${name}_before`;
    const size = `(size_t)${length}+1U`;
    return {
      before: `char* ${before}=(char*)malloc(${size}); if(!${before}){ free(${name}); return 1; } memcpy(${before},${name},${size});`,
      compare: `int mutated=memcmp(${before},${name},${size})!=0;`,
      cleanup: `free(${before});`
    };
  }

  function twoStringsMutation(policy) {
    if (policy !== "forbidden") return noMutation();
    return {
      before: "char* a_before=(char*)malloc((size_t)a_len+1U); char* b_before=(char*)malloc((size_t)b_len+1U); if(!a_before || !b_before){ free(a_before); free(b_before); free(a); free(b); return 1; } memcpy(a_before,a,(size_t)a_len+1U); memcpy(b_before,b,(size_t)b_len+1U);",
      compare: "int mutated=memcmp(a_before,a,(size_t)a_len+1U)!=0 || memcmp(b_before,b,(size_t)b_len+1U)!=0;",
      cleanup: "free(a_before); free(b_before);"
    };
  }

  function twoArraysMutation(policy) {
    if (policy !== "forbidden") return noMutation();
    return {
      before: "int* a_before=NULL; int* b_before=NULL; if(na>0){ a_before=(int*)malloc(sizeof(*a)*(size_t)na); if(!a_before){ free(a); free(b); return 1; } memcpy(a_before,a,sizeof(*a)*(size_t)na); } if(nb>0){ b_before=(int*)malloc(sizeof(*b)*(size_t)nb); if(!b_before){ free(a_before); free(a); free(b); return 1; } memcpy(b_before,b,sizeof(*b)*(size_t)nb); }",
      compare: "int mutated=(na>0 && memcmp(a_before,a,sizeof(*a)*(size_t)na)!=0) || (nb>0 && memcmp(b_before,b,sizeof(*b)*(size_t)nb)!=0);",
      cleanup: "free(a_before); free(b_before);"
    };
  }

  const DRIVER_REGISTRY = Object.freeze({
    int_array_n_int: {
      validate: (args) => validateArgs("int_array_n_int", args),
      read: () => `int n; if(scanf("%d",&n)!=1 || n<0) return 1; ${readIntegerArray("arr", "n")} int value; if(scanf("%d",&value)!=1) return 1;`,
      call: (fn) => `${fn}(arr, n, value)`,
      snapshot: (mutation) => arrayMutation(mutation, "arr", "n"),
      cleanup: () => "free(arr);",
      stdin: (args) => [args.n, ...args.arr, args.value],
      format: (args) => formatArgs("int_array_n_int", args)
    },
    int_array_n: {
      validate: (args) => validateArgs("int_array_n", args),
      read: () => `int n; if(scanf("%d",&n)!=1 || n<0) return 1; ${readIntegerArray("arr", "n")}`,
      call: (fn) => `${fn}(arr, n)`,
      snapshot: (mutation) => arrayMutation(mutation, "arr", "n"),
      cleanup: () => "free(arr);",
      stdin: (args) => [args.n, ...args.arr],
      format: (args) => formatArgs("int_array_n", args)
    },
    sentinel_int_array_int: {
      validate: (args) => validateArgs("sentinel_int_array_int", args),
      read: () => `int n; if(scanf("%d",&n)!=1 || n<0) return 1; size_t probe=1; while(probe<=(size_t)n) probe*=2U; int* arr=(int*)malloc(sizeof(*arr)*(probe+1U)); if(!arr) return 1; for(int i=0;i<n;i++) if(scanf("%d",&arr[i])!=1) return 1; for(size_t i=(size_t)n;i<=probe;i++) arr[i]=INT_MIN; int value; if(scanf("%d",&value)!=1) return 1;`,
      call: (fn) => `${fn}(arr, value)`,
      snapshot: (mutation) => arrayMutation(mutation, "arr", "(probe+1U)"),
      cleanup: () => "free(arr);",
      stdin: (args) => [args.arr.length, ...args.arr, args.value],
      format: (args) => formatArgs("sentinel_int_array_int", args)
    },
    matrix_rows_int: {
      validate: (args) => validateArgs("matrix_rows_int", args),
      read: () => `int m, cols; if(scanf("%d%d",&m,&cols)!=2 || m<1 || cols!=N) return 1; int mat[m][N]; for(int row=0;row<m;row++) for(int col=0;col<N;col++) if(scanf("%d",&mat[row][col])!=1) return 1; int value; if(scanf("%d",&value)!=1) return 1;`,
      call: (fn) => `${fn}(mat, m, value)`,
      snapshot: (mutation) => matrixMutation(mutation),
      cleanup: () => "",
      stdin: (args) => [args.m, args.cols, ...args.mat.flat(), args.value],
      format: (args) => formatArgs("matrix_rows_int", args)
    },
    string_only: {
      validate: (args) => validateArgs("string_only", args),
      read: () => readString("buf", "len"),
      call: (fn) => `${fn}(buf)`,
      snapshot: (mutation) => stringMutation(mutation, "buf", "len"),
      cleanup: () => "free(buf);",
      stdin: (args) => stdinString(args.s),
      format: (args) => formatArgs("string_only", args)
    },
    string_int: {
      validate: (args) => validateArgs("string_int", args),
      read: () => `${readString("buf", "len")} int value; if(scanf("%d",&value)!=1) return 1;`,
      call: (fn) => `${fn}(buf, value)`,
      snapshot: (mutation) => stringMutation(mutation, "buf", "len"),
      cleanup: () => "free(buf);",
      stdin: (args) => [...stdinString(args.s), args.value],
      format: (args) => formatArgs("string_int", args)
    },
    string_char: {
      validate: (args) => validateArgs("string_char", args),
      read: () => `${readString("buf", "len")} int value_input; if(scanf("%d",&value_input)!=1 || value_input<1 || value_input>255) return 1; char value=(char)value_input;`,
      call: (fn) => `${fn}(buf, value)`,
      snapshot: (mutation) => stringMutation(mutation, "buf", "len"),
      cleanup: () => "free(buf);",
      stdin: (args) => [...stdinString(args.s), stdinChar("string_char", args.value)],
      format: (args) => formatArgs("string_char", args)
    },
    two_strings: {
      validate: (args) => validateArgs("two_strings", args),
      read: () => `${readString("a", "a_len")} ${readString("b", "b_len")}`,
      call: (fn) => `${fn}(a, b)`,
      snapshot: (mutation) => twoStringsMutation(mutation),
      cleanup: () => "free(a); free(b);",
      stdin: (args) => [...stdinString(args.a), ...stdinString(args.b)],
      format: (args) => formatArgs("two_strings", args)
    },
    int_only: {
      validate: (args) => validateArgs("int_only", args),
      read: () => `int value; if(scanf("%d",&value)!=1) return 1;`,
      call: (fn) => `${fn}(value)`,
      snapshot: () => noMutation(),
      cleanup: () => "",
      stdin: (args) => [args.value],
      format: (args) => formatArgs("int_only", args)
    },
    two_ints: {
      validate: (args) => validateArgs("two_ints", args),
      read: () => `int first, second; if(scanf("%d%d",&first,&second)!=2) return 1;`,
      call: (fn) => `${fn}(first, second)`,
      snapshot: () => noMutation(),
      cleanup: () => "",
      stdin: (args) => [args.first, args.second],
      format: (args) => formatArgs("two_ints", args)
    },
    two_int_arrays: {
      validate: (args) => validateArgs("two_int_arrays", args),
      read: () => `int na; if(scanf("%d",&na)!=1 || na<0) return 1; ${readIntegerArray("a", "na")} int nb; if(scanf("%d",&nb)!=1 || nb<0) return 1; ${readIntegerArray("b", "nb")}`,
      call: (fn) => `${fn}(a, na, b, nb)`,
      snapshot: (mutation) => twoArraysMutation(mutation),
      cleanup: () => "free(a); free(b);",
      stdin: (args) => [args.na, ...args.a, args.nb, ...args.b],
      format: (args) => formatArgs("two_int_arrays", args)
    }
  });

  function driverFor(q, question, cases) {
    const config = driverQuestion(question);
    if (!Array.isArray(cases)) throw new Error("Invalid driver cases: cases must be an array");
    const entry = DRIVER_REGISTRY[config.driver];
    return sourceFor(entry.read(), entry.call(selectedFunction(q)), entry.snapshot(config.mutation), entry.cleanup());
  }

  function driverStdin(question, cases) {
    const config = driverQuestion(question);
    if (!Array.isArray(cases)) throw new Error("Invalid driver cases: cases must be an array");
    const entry = DRIVER_REGISTRY[config.driver];
    const lines = [String(cases.length)];
    for (const testCase of cases) {
      if (!isObject(testCase)) throw new Error("Invalid driver case: case must be an object");
      const args = entry.validate(testCase.args);
      lines.push(...entry.stdin(args).map(String));
    }
    return lines.join("\n") + "\n";
  }

  return {normalizeManifest, validateArgs, cString, cChar, formatArgs, driverFor, driverStdin};
})();
