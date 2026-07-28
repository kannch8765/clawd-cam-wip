# Architecture

## Goals for task 001

The foundation keeps build, UI, PWA, quality, and deployment concerns explicit while avoiding premature camera implementation. Future features should be added behind clear feature boundaries rather than growing the root application component.

## Directory layout

```text
src/
  app/                 Application composition and app-level tests
  features/
    camera/            Camera feature boundary; placeholder only in task 001
  styles/              Global styles and design tokens
  test/                Shared test environment setup
public/                 Static PWA placeholder assets
docs/                   Architecture and contributor documentation
.github/workflows/      CI and GitHub Pages automation
```

## Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` registers the generated Service Worker and mounts React.
3. `src/app/App.tsx` composes feature-level UI.
4. `vite-plugin-pwa` generates the web app manifest and Workbox Service Worker for production builds.

## GitHub Pages base path

`vite.config.ts` reads `GITHUB_REPOSITORY` only inside GitHub Actions. It derives `/<repository-name>/` as Vite's production base, which makes built asset URLs work in both the WIP fork and the upstream repository. Local development uses `/`.

## Quality gates

The `check` command and CI execute the same four gates:

1. ESLint
2. Prettier check
3. Vitest
4. TypeScript + Vite production build

Keeping the commands identical prevents CI-only validation behavior.

## Planned feature boundaries

Later tasks may add modules for camera access, overlay manipulation, capture composition, local gallery persistence, and sharing. Those modules should depend on browser APIs through small adapters so permission, unsupported-browser, and test behavior remain isolated.

Task 001 does not create those adapters or data models because their requirements have not yet been implemented or reviewed.
