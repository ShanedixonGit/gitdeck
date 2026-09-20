# Contributing

## Setup

```bash
npm install
npm run dev          # Chrome with hot reload
npm run dev:firefox  # Firefox
```

Node 20 or newer.

## Commands

| Command                 | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Chrome, hot reload                      |
| `npm run dev:firefox`   | Firefox, hot reload                     |
| `npm run build`         | Production build → `.output/chrome-mv3` |
| `npm run build:firefox` | → `.output/firefox-mv3`                 |
| `npm run build:edge`    | → `.output/edge-mv3`                    |
| `npm run zip`           | Store-ready archive                     |
| `npm test`              | Unit tests                              |
| `npm run test:watch`    | Unit tests in watch mode                |
| `npm run compile`       | Type-check `.ts` and `.svelte`          |
| `npm run lint`          | ESLint                                  |
| `npm run format`        | Prettier, writing changes               |
| `npm run icons`         | Regenerate `src/public/icon/*.png`      |
| `npm run check`         | Everything CI runs                      |

## Loading a build by hand

- **Chrome / Edge** — `chrome://extensions` → Developer mode → _Load unpacked_ →
  `.output/chrome-mv3`
- **Firefox** — `about:debugging#/runtime/this-firefox` → _Load Temporary Add-on_ →
  `.output/firefox-mv3/manifest.json`

## Adding a tool

See [docs/adding-a-tool.md](docs/adding-a-tool.md). Verify the tool works before you add it, and
record the verification in [docs/tools.md](docs/tools.md).

## Ground rules

- **Tools are data.** No conditional anywhere should test a tool `id`. If a tool cannot be
  expressed as a template, the template engine needs extending, not the UI.
- **`lib/` stays pure.** `src/lib/github` and `src/lib/tools` must not import from the DOM or the
  extension APIs. That is what keeps them testable in Node.
- **Permissions are load-bearing.** Do not add a manifest permission without a user-visible
  feature that needs it, and update the privacy section of the README and
  [docs/architecture.md](docs/architecture.md) in the same change.
- **No network requests from the extension.** Not for icons, not for availability checks, not for
  metrics.
- **Test the logic, not the framework.** New behaviour in `lib/` arrives with tests.

## Commits

Short imperative subject lines (`Add DeepWiki to the registry`). Keep a change to one concern —
a tool addition, a UI change and a build change are three commits.

Run `npm run check` before opening a pull request.
