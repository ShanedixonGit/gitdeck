# Contributing

## Setup

```bash
npm install
npm run dev          # Chrome with hot reload
npm run dev:firefox  # Firefox
```

Node 20 or newer. The end-to-end tests also need Google Chrome installed, and a one-time download
of Playwright's Chromium, Firefox and WebKit builds (about 300 MB, into Playwright's cache):

```bash
npx playwright-core install chromium firefox webkit
```

## Commands

| Command                 | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Chrome, hot reload                          |
| `npm run dev:firefox`   | Firefox, hot reload                         |
| `npm run build`         | Production build → `.output/chrome-mv3`     |
| `npm run build:firefox` | → `.output/firefox-mv3`                     |
| `npm run build:edge`    | → `.output/edge-mv3`                        |
| `npm run zip:all`       | Store archives for all three, + sources     |
| `npm test`              | Unit tests                                  |
| `npm run test:e2e`      | Build, then test the pages in 3 engines     |
| `npm run test:browsers` | The extension in real Chrome, Edge, Firefox |
| `npm run test:coverage` | Unit tests with the coverage floor          |
| `npm run test:watch`    | Unit tests in watch mode                    |
| `npm run compile`       | Type-check `.ts` and `.svelte`              |
| `npm run lint`          | ESLint                                      |
| `npm run format`        | Prettier, writing changes                   |
| `npm run icons`         | Regenerate `src/public/icon/*.png`          |
| `npm run screenshots`   | Store screenshots → `docs/images/store`     |
| `npm run check`         | Everything CI runs                          |

## Loading a build by hand

- **Chrome** — `chrome://extensions` → Developer mode → _Load unpacked_ → `.output/chrome-mv3`
- **Edge** — `edge://extensions` → Developer mode → _Load unpacked_ → `.output/edge-mv3`
  (`npm run build:edge`)
- **Firefox** — `about:debugging#/runtime/this-firefox` → _Load Temporary Add-on_ →
  `.output/firefox-mv3/manifest.json` (`npm run build:firefox`), or `npm run dev:firefox`
- **Safari** — see [docs/safari.md](docs/safari.md)

## Checking it in a real browser

`npm run test:browsers` installs the packaged extension in the Chrome, Edge and Firefox installed
on this machine (macOS paths; set `CHROME_PATH`, `EDGE_PATH` or `FIREFOX_PATH` elsewhere, and a
missing browser is skipped) and runs it through first run, storage, opening tools, copying, the
options page and the open target, failing on any error from the extension's own pages. Run it
before every release.

What no automation can do is click a browser's toolbar button, so these still need a person, in
each browser:

1. On `github.com/facebook/react`, clicking the toolbar button shows the repository. On a file page it also shows
   the branch and path
2. First run: _Use the recommended deck_ fills the deck, and it is still there after reopening
3. A click, `1`–`9`, `↑`/`↓` with `Enter`, and `Tab` with `Enter` all open the tool you expect
4. Each _Open tools in_ choice on the options page does what it says; with _A background tab_ the
   popup stays open
5. Copying the HTTPS clone command puts it on the clipboard: paste it somewhere
6. Options page: drag a tool in and out, reorder by dragging and with the grip and arrow keys,
   reload, and the order is kept
7. On a page that is not a repository, the popup asks for one and accepts a pasted URL
8. The popup at 125% and 150% zoom: nothing is cut off, and a long deck scrolls

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
- **Credit the service.** Repohopper is a connector. Docs, listings and UI copy never present a linked
  tool's features as Repohopper's, and never imply an affiliation.

## Branches and commits

`main` always builds and always loads. Work happens on a short-lived branch off `main`, named for
what it does:

| Prefix   | For                                       |
| -------- | ----------------------------------------- |
| `feat/`  | a user-visible feature                    |
| `fix/`   | a bug                                     |
| `tool/`  | adding or re-verifying a registry entry   |
| `docs/`  | documentation only                        |
| `chore/` | build, CI, dependencies, release plumbing |

Short imperative subject lines (`Add DeepWiki to the registry`). Keep a change to one concern —
a tool addition, a UI change and a build change are three commits.

Run `npm run check` before opening a pull request. CI runs the same steps on every pull request
and on every push to `main`.

## Versioning and the changelog

The extension version lives in one place, `package.json`. WXT copies it into the manifest for
every browser, so nothing else should ever hard-code it.

Semantic versioning, with the pre-1.0 reading: the minor number moves for user-visible change,
the patch number for fixes. A change that alters what the user sees, or what the manifest asks
for, belongs in [CHANGELOG.md](CHANGELOG.md) under `## [Unreleased]` as part of the same pull
request — not afterwards, and not at release time from the git log.

To cut a release:

1. Move the `Unreleased` entries under a new version heading with today's date
2. Bump `version` in `package.json`
3. `npm run check && npm run test:e2e && npm run check:links`
4. `npm run screenshots`, and commit them if they changed
5. Load `.output/chrome-mv3` once by hand and confirm the popup opens
6. Merge, then tag `main`: `git tag -a v0.3.0 -m "Repohopper 0.3.0" && git push origin v0.3.0`

The tag starts the release workflow. It checks the tag matches `package.json`, runs the checks,
builds the Chrome, Edge and Firefox packages and the Firefox source archive, and attaches them to
a GitHub release whose notes are that version's changelog section. Submitting the packages to the
stores is manual; the text for each is in [docs/store-listing.md](docs/store-listing.md).
