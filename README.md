# exam — practice finals for Technion 234114 / 234117

Live at **https://blueapple12.github.io/exam/** — each exam at `/exam/<n>/`.

Hebrew exam paper on one side, a C editor on the other. **Run** compile-checks the
file, then prompts for stdin line by line and executes with real **gcc 13.2
(`-std=c99`)** through the Compiler Explorer API; **בדוק מול המקרים** compiles once
and runs every graded test case in a single program. Panes and console are
drag-resizable, editor/paper font size is adjustable, the editor auto-indents and
auto-closes brackets/quotes CLion-style, and a "פתרונות לדוגמה" button after
submission shows worked solutions (no score — that still needs `/grade`).

## Design system: one template, many exams

**`src/_template.html` is the entire look and behaviour of every exam site.**
Layout, resizing, fonts, the gcc backend, the editor, RTL handling, the scratch
pad, extra-time — all of it lives there, and it must never be forked or edited
per exam. A new exam supplies **content only**, via six small fragment files.
This is what keeps every future exam visually and functionally identical to this
one: `build.mjs` splices content into the one shared shell, so a change to the
shell (a bug fix, a new feature) instantly applies to every exam already built,
the next time each is rebuilt.

**If you're generating a new exam, do not touch `_template.html`.** Write the six
fragments below, run the build, and stop.

## Layout

```
1/index.html      built exam 1   ->  /exam/1/
index.html        landing page (add a card here per new exam)
src/              sources; edit these, never a built page, never the template
  _template.html    THE SHARED SHELL — layout/CSS/editor/gcc/scratch pad/etc.
                     (see "Design system" above — do not fork this per exam)
  _meta.json         {pageTitle, brandTitle, brandSub} — <title> + top-bar text
  _paper.html        the exam paper: Q1–Q4 markup, RTL Hebrew, no solutions
  _skeletons.js       const SKELETONS = {q2,q3,q4} — the three starting .c files
  _tests.json         {"q2":[{name,args,expect}], "q3":[...], "q4":[...]}
  _q1key.txt          Q1 answers: base64(encodeURIComponent(JSON)),
                       {"a":{"time":"Θ(...)","space":"Θ(...)"},"b":{...},"c":{...}}
                       every value must match COMPLEXITY_OPTS in the template verbatim
  _solutions.js       const SOLUTIONS = {q2,q3,q4} — {archetype, complexity, code}
                       shown to the student after they submit (no score, no ai)
  build.mjs           node src/build.mjs <n>  ->  writes ../<n>/index.html
```

Build: `node src/build.mjs <n>`, then commit and push (Pages redeploys in ~20s).

## Test manifests and the driver contract

The shared driver core accepts the legacy exam-001 manifest and the version-2
manifest below. Version 2 is the format for new exams:

```json
{
  "version": 2,
  "questions": {
    "q2": {
      "driver": "int_array_n_int",
      "mutation": "allowed",
      "cases": [
        {"name": "t01", "args": {"arr": [1, 2], "n": 2, "value": 1}, "expect": "0"}
      ]
    },
    "q3": {
      "driver": "string_int",
      "mutation": "forbidden",
      "cases": [
        {"name": "t01", "args": {"s": "abba", "value": 2}, "expect": "4"}
      ]
    },
    "q4": {
      "driver": "two_int_arrays",
      "mutation": "allowed",
      "cases": [
        {"name": "t01", "args": {"a": [1], "na": 1, "b": [2], "nb": 1}, "expect": "-1"}
      ]
    }
  }
}
```

The top-level `version` must be exactly `2`, and `questions` must contain only
`q2`, `q3`, and `q4`. Every question has exactly `driver`, `mutation`, and
`cases`; every case has a unique nonempty `name`, an object `args`, and a
decimal-integer string `expect`. The offline verifier requires at least twelve
cases per question. Argument values are validated before compilation: integers
are signed 32-bit values, strings contain no NUL, and declared lengths match
their arrays or matrices.

The driver id is a closed allowlist. Each id accepts these required `args`
keys and emits the shown call to the question's `examT_qN` function:

| Driver id | Required args | Generated call |
| --- | --- | --- |
| `int_array_n_int` | `arr` (int array), `n` (length), `value` (int) | `examT_qN(arr, n, value)` |
| `int_array_n` | `arr` (int array), `n` (length) | `examT_qN(arr, n)` |
| `sentinel_int_array_int` | `arr` (logical int array), `value` (int) | `examT_qN(arr, value)` |
| `matrix_rows_int` | `mat` (rectangular int matrix), `m` (rows), `cols` (columns), `value` (int) | `examT_qN(mat, m, value)` |
| `string_only` | `s` (string) | `examT_qN(buf)` |
| `string_int` | `s` (string), `value` (int) | `examT_qN(buf, value)` |
| `string_char` | `s` (string), `value` (one single-byte character) | `examT_qN(buf, value)` |
| `two_strings` | `a` (string), `b` (string) | `examT_qN(a, b)` |
| `int_only` | `value` (int) | `examT_qN(value)` |
| `two_ints` | `first` (int), `second` (int) | `examT_qN(first, second)` |
| `two_int_arrays` | `a` (int array), `na` (length), `b` (int array), `nb` (length) | `examT_qN(a, na, b, nb)` |

`n`, `m`, `cols`, `na`, and `nb` must match the corresponding input
dimensions. For `matrix_rows_int`, `cols` must also match the skeleton's
compile-time `N`. For `sentinel_int_array_int`, the logical array is supplied
without a sentinel; the generated driver allocates through the next doubling
probe and fills the trailing slots with `INT_MIN`.

Each question declares a mutation policy: `allowed` accepts either unchanged
or in-place-modified mutable inputs, while `forbidden` snapshots mutable
arrays, matrices, and strings and fails a case if any byte/value changes. The
snapshot includes the generated sentinel padding and string terminator where
applicable. Scalar-only drivers have no mutable input and always report no
mutation. The policy is per question, not tied to q2, q3, or q4.

For backward compatibility, a manifest without `version` is interpreted as
the exam-001 shape: q2 and q4 use `int_array_n_int` with `mutation: "allowed"`,
and q3 uses `string_int` with `mutation: "forbidden"`. Legacy q2 `x` and q3/q4
`k` argument names are canonicalized to `value` only when `value` is absent;
conflicting aliases remain invalid under strict argument validation. The
normalized representation is always version 2 and is copied before use.

Manifest data selects only a registered typed driver. The verifier and browser
generate the complete C harness from that registry; artifacts must not contain
arbitrary C driver source (for example a `c_source` field), and manifest data is
never evaluated as JavaScript or C.

## Per-page state, one shared origin

Every exam lives under the same origin (`blueapple12.github.io`), and
`localStorage` is scoped per-origin, not per-path — so the template derives its
storage key from `location.pathname` at runtime (`examstate-<n>-v1`). Never
hardcode a storage key in a fragment; exam 2's saved code would otherwise clobber
exam 1's.

Layout/font preferences (`examUiPrefsV1`) are **deliberately** a single shared
key across every exam — a size or split the student picked on exam 1 should
carry over to exam 2 without them having to redo it.

## Verify before shipping

`_solutions.js`'s code **must be the same code already gcc-tested** when the
tests were built (`tools/exam-page/vet-skeletons.js` or an equivalent driver
compiled via the Compiler Explorer API) — never hand-write a "prettier" version
for display that hasn't been run. See `predictor/06-trainer.md` /
`.claude/commands/exam.md` for the full generation + verification procedure.

**This repo is public** (GitHub Pages needs it on a free account) and the Q1 key
is only base64 in the page — anyone with the link can extract the answers.
