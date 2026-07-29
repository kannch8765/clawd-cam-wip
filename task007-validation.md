# Task 007 one-shot validation

- source commit: `2a449f6b563e26b0d6aae95b510c3a22b47156d1`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 check
> npm run lint && npm run format:check && npm run test && npm run build


> clawd-cam@0.1.0 lint
> eslint . --max-warnings=0


/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/photoFile.test.ts
  72:34  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex

/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/photoFile.ts
  14:33  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex

✖ 2 problems (2 errors, 0 warnings)

```
