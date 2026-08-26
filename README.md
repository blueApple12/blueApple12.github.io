# exam — practice finals for Technion 234114 / 234117

Live at **https://blueapple12.github.io/exam/** — each exam at `/exam/<n>/`.

Hebrew exam paper on one side, a C editor on the other. **Run** compiles the file
with real **gcc 13.2 (`-std=c99`)** through the Compiler Explorer API and then
prompts for stdin line by line; **בדוק מול המקרים** compiles once and runs every
graded test case in a single program.

## Layout

```
1/index.html      built exam 1   ->  /exam/1/
index.html        landing page
src/              sources; edit these, never the built page
  _template.html    page shell: CSS, editor, runner, scratch pad
  _paper.html       the exam paper (RTL Hebrew)
  _skeletons.js     the three starting .c files
  _tests.json       graded test cases
  _q1key.txt        Q1 answers, base64(encodeURIComponent(json))
  build.mjs         node src/build.mjs <n>
```

Rebuild after editing any source: `node src/build.mjs 1`, then commit and push.

**This repo is public** (GitHub Pages needs it on a free account) and the Q1 key is
only base64 in the page — anyone with the link can extract the answers.
