# Task 007 one-shot validation

- source commit: `95f8e879f56e9bc72916accfed3dd26d252ece6d`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 check
> npm run lint && npm run format:check && npm run test && npm run build


> clawd-cam@0.1.0 lint
> eslint . --max-warnings=0


/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/SharingServicesContext.tsx
  26:17  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components

/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/photoFile.test.ts
  72:34  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex

/home/runner/work/clawd-cam-wip/clawd-cam-wip/src/features/sharing/photoFile.ts
  14:33  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex

✖ 3 problems (3 errors, 0 warnings)

```
