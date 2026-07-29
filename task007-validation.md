# Task 007 one-shot validation

- source commit: `d3a3c0eb011b886eb9d46fd270959a3d4c7cd10f`
- command: `npm run check`
- result: **FAILED**

```text

> clawd-cam@0.1.0 check
> npm run lint && npm run format:check && npm run test && npm run build


> clawd-cam@0.1.0 lint
> eslint . --max-warnings=0


> clawd-cam@0.1.0 format:check
> prettier --check . --ignore-unknown

Checking formatting...
[[33mwarn[39m] src/features/sharing/photoFile.test.ts
[[33mwarn[39m] src/features/sharing/photoFile.ts
[[33mwarn[39m] src/features/sharing/SharingFlow.integration.test.tsx
[[33mwarn[39m] src/features/sharing/sharingServices.ts
[[33mwarn[39m] src/features/sharing/SharingServicesContext.tsx
[[33mwarn[39m] src/features/sharing/sharingTypes.ts
[[33mwarn[39m] src/features/sharing/usePhotoSharing.test.tsx
[[33mwarn[39m] src/features/sharing/usePhotoSharing.ts
[[33mwarn[39m] Code style issues found in 8 files. Run Prettier with --write to fix.
```
