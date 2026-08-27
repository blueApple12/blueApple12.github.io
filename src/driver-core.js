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
      const source = hasVersion ? questions[id] : {...LEGACY[id], cases:questions[id]};
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
    return `\\x${byte.toString(16).padStart(2, "0").toUpperCase()}`;
  }

  function cString(value) {
    if (typeof value !== "string") throw new TypeError("cString expects a string");
    return `"${utf8Bytes(value).map((byte) => escapedByte(byte, 0x22)).join("")}"`;
  }

  function cChar(value) {
    if (typeof value !== "string" || Array.from(value).length !== 1) {
      throw new TypeError("cChar expects a single character");
    }
    return `'${utf8Bytes(value).map((byte) => escapedByte(byte, 0x27)).join("")}'`;
  }

  function preview(value, limit = 8) {
    if (Array.isArray(value)) {
      const items = value.slice(0, limit).map((item) => Array.isArray(item) ? preview(item, limit) : String(item));
      if (value.length > limit) items.push("...");
      return `[${items.join(", ")}]`;
    }
    return String(value);
  }

  function formatArgs(driver, args) {
    const validated = validateArgs(driver, args);
    return ARGUMENT_KEYS[driver].map((key) => {
      const value = validated[key];
      if (typeof value === "string") {
        const literal = driver === "string_char" && key === "value" ? cChar(value) : cString(value);
        return `${key}=${literal} (len=${Array.from(value).length})`;
      }
      if (Array.isArray(value)) return `${key}=${preview(value)} (len=${value.length})`;
      return `${key}=${String(value)}`;
    }).join(", ");
  }

  return {normalizeManifest, validateArgs, cString, cChar, formatArgs};
})();
