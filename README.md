# GitDeck

A cross-browser extension that turns _"here is a GitHub repository"_ into _"here are all the
useful ways I can view, analyse, develop and visualise this repository."_

Open a repository on github.com, click the GitDeck icon, and you get a deck of tools — browser
IDEs, architecture diagrams, dependency graphs, AI context exporters — each one a single click
away, pointed at the repository you are already looking at.

GitDeck does not reimplement any of those tools. It is a **launcher**: it reads the repository
from the URL, rewrites it for each service, and opens the result. No backend, no accounts, no
network requests of its own.

```
github.com/facebook/react
        │
        ├─▶ github.dev/facebook/react              Open in a browser IDE
        ├─▶ gitdiagram.com/facebook/react          Visualise the architecture
        ├─▶ deepwiki.com/facebook/react            Read a generated wiki
        ├─▶ gitingest.com/facebook/react           Export as LLM context
        └─▶ deps.dev/project/github/facebook%2Freact   Inspect the dependency graph
```

## Status

Early foundation. The architecture, tool registry, URL transformation layer and popup UI exist
and work; polish and store distribution do not yet. See [docs/roadmap.md](docs/roadmap.md).

## Quick start

```bash
npm install
npm run dev              # Chrome, with hot reload
npm run dev:firefox      # Firefox
npm test                 # unit tests
npm run check            # types + lint + format + tests
```

`npm run dev` launches a browser with the extension already loaded. To load a build by hand:

- **Chrome / Edge** — `npm run build`, then `chrome://extensions` → Developer mode → _Load
  unpacked_ → `.output/chrome-mv3`
- **Firefox** — `npm run build:firefox`, then `about:debugging#/runtime/this-firefox` → _Load
  Temporary Add-on_ → `.output/firefox-mv3/manifest.json`

## How it works

Four small pieces, each independently testable:

| Piece           | File                           | Responsibility                                               |
| --------------- | ------------------------------ | ------------------------------------------------------------ |
| Parser          | `src/lib/github/parse-repo.ts` | Any GitHub URL → `{ owner, repo, ref?, path? }`              |
| Registry        | `src/lib/tools/registry.ts`    | The list of tools, as data                                   |
| Template engine | `src/lib/tools/template.ts`    | `https://x.dev/{owner}/{repo}` → a real URL                  |
| Resolver        | `src/lib/tools/resolve.ts`     | Registry + repository → the deck, skipping what cannot apply |

The UI (Svelte) only consumes the resolver's output. It contains no knowledge of any individual
tool. Adding a tool is one object in one array — see
[docs/adding-a-tool.md](docs/adding-a-tool.md).

## Why this stack

| Choice                                   | Reason                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[WXT](https://wxt.dev)**               | Generates a correct MV3 manifest per browser from one config, and ships dev-mode hot reload. The alternative is hand-maintaining divergent Chrome and Firefox manifests, which is exactly the kind of busywork that kills small extension projects.                                          |
| **Svelte 5**                             | The popup is a list that reacts to one piece of state. Svelte compiles to direct DOM updates with no runtime framework shipped, which keeps the popup at ~60 kB total and opening instantly. React would add ~45 kB of runtime for a UI this small; the choice is about weight, not fashion. |
| **TypeScript (strict)**                  | The registry is the product. Strict types plus `validateTool` mean a malformed tool entry fails CI rather than the popup. Pinned to 5.9 because `typescript-eslint` does not yet support TypeScript 7.                                                                                       |
| **Vitest**                               | The URL logic is pure functions with no DOM. Vitest runs them in milliseconds and shares Vite's config with the build.                                                                                                                                                                       |
| **No backend, no storage, no analytics** | Every feature in scope is a string transformation. Adding infrastructure would add privacy obligations and maintenance cost for no user benefit.                                                                                                                                             |

## Privacy and permissions

GitDeck requests exactly one permission: `activeTab`.

- It reads the current tab's URL _only_ when you click the extension icon.
- It never reads repository contents, page DOM, or any other tab.
- It makes no network requests. It has no content scripts, no background worker, no host
  permissions, no storage, no telemetry.
- The only thing that ever leaves your browser is the navigation you explicitly click, to the
  third-party service you chose.

Tool icons are rendered as local text monograms rather than fetched favicons, so opening the
popup does not announce the repository you are viewing to sixteen third parties.

See [docs/architecture.md](docs/architecture.md#security-and-privacy-model) for the full model.

## Documentation

- [docs/architecture.md](docs/architecture.md) — product spec and technical architecture
- [docs/tools.md](docs/tools.md) — the tool registry, how each entry was verified, and what was rejected
- [docs/adding-a-tool.md](docs/adding-a-tool.md) — how to add a tool
- [docs/roadmap.md](docs/roadmap.md) — phased development plan
- [CONTRIBUTING.md](CONTRIBUTING.md) — development workflow

## Licence

MIT
