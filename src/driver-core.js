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

  return {normalizeManifest};
})();
