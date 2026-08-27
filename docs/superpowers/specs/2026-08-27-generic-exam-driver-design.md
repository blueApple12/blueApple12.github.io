# Generic Exam Driver Design

**Date:** 2026-08-27

**Status:** Approved approach; implementation pending

## Goal

Allow exams 002–021 to retain the exact C function signatures in their approved
specifications while using the same shared browser template and the same
offline verification path as exam 001.

## Context

The current verifier and browser template generate drivers for exam 001 only:

- Q2 calls `examT_q2(arr, n, x)`.
- Q3 calls `examT_q3(s, k)`.
- Q4 calls `examT_q4(arr, n, k)`.

The approved specifications for exams 002–021 include matrices, strings,
scalars, two arrays, and other argument combinations. Altering those signatures
or maintaining a template fork per exam would violate the project contract.

## Chosen Approach

Add an explicit driver-kind field to each question in `_tests.json`. The shared
driver generator dispatches on that closed set of kinds and converts trusted
JSON arguments into a complete C test driver. Both `verify.mjs` and the browser
runtime use the same metadata vocabulary and produce semantically equivalent C.

This keeps the existing six-fragment build contract. No per-exam template fork
or seventh runtime fragment is introduced.

## Test Manifest Shape

The legacy exam-001 form remains accepted:

```json
{
  "q2": [{ "name": "t01", "args": {}, "expect": "0" }],
  "q3": [{ "name": "t01", "args": {}, "expect": "0" }],
  "q4": [{ "name": "t01", "args": {}, "expect": "0" }]
}
```

New exams use a versioned form:

```json
{
  "version": 2,
  "questions": {
    "q2": {
      "driver": "array_n_x",
      "cases": [{ "name": "t01", "args": {}, "expect": "0" }]
    },
    "q3": {
      "driver": "string_only",
      "mutation": "required",
      "cases": [{ "name": "t01", "args": {}, "expect": "0" }]
    },
    "q4": {
      "driver": "scalar_acc",
      "cases": [{ "name": "t01", "args": {}, "expect": "0" }]
    }
  }
}
```

`version` must equal `2`. Each question must contain one recognized `driver`,
one `mutation` policy (`"forbidden"`, `"required"`, or `"ignored"`), and at
least twelve cases. Cases retain `name`, `args`, and string `expect` so the
result comparison and report UI remain stable. Mutation policy is evaluated
only for driver kinds whose inputs can be snapshotted; `"required"` means at
least one input differs after the call, while `"forbidden"` means none may
differ.

## Driver Vocabulary

The implementation will define the smallest closed set that covers the exact
signatures in specs 002–021. Expected families include:

- integer array with length and zero, one, or two scalar arguments;
- sentinel-terminated integer array plus a scalar;
- fixed-width integer matrix plus row count and scalar;
- one string, optionally with a character or integer argument;
- two strings;
- one or two scalar integers;
- two integer arrays with independent lengths.

Driver names describe argument shape, not exam number or algorithm. Repeated
problem signatures reuse a driver kind. Each kind owns strict validation of its
required keys and emits declarations, escaped literals, the exact target call,
and one normalized result line per case.

The concrete kind registry and schemas will be locked by tests before exam
artifacts are authored.

## Architecture

### Shared driver core

Create a small, side-effect-free driver module beside the build scripts. It
will provide:

- manifest normalization for legacy and version-2 data;
- schema validation with question/case-specific error messages;
- C literal serialization for integers, arrays, matrices, strings, and chars;
- driver generation for a question’s complete case list.
- normalized interpretation of the per-question mutation policy.

Node verification imports this module directly. The browser receives the same
registry logic through the normal build, avoiding an independently maintained
second implementation. The build script will splice the browser-safe driver
core into one new template placeholder.

### Verification path

`verify.mjs` continues to splice each model solution into its skeleton, rename
the skeleton `main`, compile once per question with gcc 13.2, execute all cases,
and compare normalized results. Its current hard-coded `driverFor` logic is
replaced by the shared registry.

Malformed manifests, unknown driver kinds, missing arguments, invalid array
lengths, and unsafe integer/string values fail before any network compilation.

### Browser path

The page parses and normalizes the embedded test manifest, generates the same C
driver for the student submission, and preserves existing progress, feedback,
and solution-reveal behavior. Browser-only structural checks remain in place.

### Build path

`build.mjs` adds one deterministic replacement for the shared driver-core
placeholder. The six per-exam fragments and their public interfaces remain
unchanged. It must fail if any required placeholder is absent or remains after
splicing.

## Safety and Validation

- Driver kinds are a fixed allowlist; artifacts cannot inject arbitrary driver
  source through metadata.
- C literals are emitted only by type-specific serializers.
- Strings and characters escape backslashes, quotes, control characters, and
  non-printable bytes.
- Integer values must be finite safe integers within the supported C range.
- Declared lengths must match actual arrays, except the explicitly documented
  sentinel-array form.
- Matrices must be rectangular and match the compile-time column count required
  by the corresponding skeleton.
- Case names must be unique within a question.
- Mutation policies are explicit, preventing the exam-001 Q3 no-mutation rule
  from being applied to new in-place string questions.
- Expected values remain decimal strings and are compared as normalized first
  tokens, preserving current behavior.

## Backward Compatibility

Exam 001 and its existing `_tests.json` remain byte-for-byte valid. The
normalizer maps its legacy q2/q3/q4 arrays to the three current driver kinds.
The existing built exam-001 page is regenerated during testing and compared at
the behavior level; its tests must still compile and pass.

## Testing Strategy

Implementation follows red-green-refactor:

1. Unit tests first for manifest normalization, every driver kind, literal
   escaping, invalid manifests, and exact generated calls.
2. Integration tests that splice and compile representative signatures,
   including matrix, two-string, scalar-only, and two-array cases.
3. A browser/template contract test proving the built page contains the shared
   registry and no unresolved placeholders.
4. Regression verification of exam 001.
5. For every new exam, independent Python brute-force generators produce all
   expected outputs, followed by the real gcc 13.2 `verify.mjs` gate.

## Batch Execution

After the shared driver work passes its tests, exams are authored in isolated
archives under `exams/<R>/pages-src/`. No parallel worker writes to
`pages/src`. A single integration phase copies each archive into the shared
scratch directory, verifies it, builds `pages/<N>/index.html`, and records the
result before advancing.

## Non-goals

- Do not alter any approved problem signature or semantics.
- Do not edit exam specs to fit the runtime.
- Do not create per-exam template forks.
- Do not expose model solutions on the paper.
- Do not redesign the exam page or change its public workflow.
- Do not add arbitrary C snippets to `_tests.json`.
