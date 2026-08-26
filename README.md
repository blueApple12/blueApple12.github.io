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
