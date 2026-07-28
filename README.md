# ClawdCam

Bring a little Clawd everywhere.

ClawdCam is a mobile-first Progressive Web App foundation for a future camera experience. Task 001 intentionally contains only the application shell, offline/PWA plumbing, quality tooling, CI, GitHub Pages deployment, and a camera placeholder.

## Scope of this foundation

Included:

- React + TypeScript + Vite application shell
- generated Service Worker and web app manifest via `vite-plugin-pwa`
- responsive camera placeholder page
- ESLint, Prettier, Vitest, and Testing Library
- GitHub Actions for CI and GitHub Pages deployment
- architecture and development documentation

Deliberately not included:

- camera permission or `getUserMedia()`
- photo capture or canvas composition
- IndexedDB persistence
- Web Share integration
- Clawd GIFs or other official production assets

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Commands

| Command                | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the Vite development server        |
| `npm run build`        | Type-check and create a production build |
| `npm run preview`      | Preview the production build locally     |
| `npm run lint`         | Run ESLint with zero warnings allowed    |
| `npm run format`       | Format supported files with Prettier     |
| `npm run format:check` | Verify formatting without changing files |
| `npm run test`         | Run the Vitest suite once                |
| `npm run test:watch`   | Run Vitest in watch mode                 |
| `npm run check`        | Run lint, format check, tests, and build |

## PWA behavior

`vite-plugin-pwa` generates the manifest and Workbox Service Worker during production builds. The Service Worker is registered from `src/main.tsx` and updates automatically. Development mode does not enable camera access or any future data features.

The included icon files are neutral placeholders for installability and must be replaced by approved project artwork in a later scoped task.

## GitHub Pages

The Vite base path is derived from `GITHUB_REPOSITORY` during GitHub Actions builds, so both `clawd-cam-wip` and the upstream `clawd-cam` repository can deploy without hard-coded fork paths.

The deployment workflow runs on manual dispatch and pushes to `main`. Repository Pages settings must use **GitHub Actions** as the source.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the initial directory boundaries, deployment flow, and planned extension points.
