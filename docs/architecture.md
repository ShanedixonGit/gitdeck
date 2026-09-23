# Architecture

## 1. What GitDeck is

A browser extension that aggregates URL-addressable tools for GitHub repositories. It reads the
repository from the current tab's URL, rewrites that URL for each tool in a curated registry, and
presents the results as a keyboard-navigable deck.

The value is **aggregation, discovery and UX**. GitDeck deliberately reimplements none of the
services it links to.

### Connector, not provider

GitDeck is a connector between a GitHub repository and other services. Documentation, store
listings and UI copy describe what GitDeck itself does, and credit everything else to the
service that does it.

| GitDeck's own                                                    | Belongs to the linked service                          |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| Parsing the repository, ref and path from the tab's URL          | Everything the destination page shows or does          |
| Rendering each tool's destination URL from the registry          | Accuracy of generated wikis, diagrams, digests, scores |
| Composing clone commands and copying them to the clipboard       | Cloning itself (`git`, `gh`) and the ZIP (GitHub)      |
| The deck: choosing, ordering, keyboard access, the options page  | Accounts, sign-in, pricing and usage limits            |
| Curation: which tool per job, and the reasons in `docs/tools.md` | Terms of service and privacy policy after the click    |
| Link checking (`scripts/check-links.ts`): up, and the right site | Uptime, and whether the page is right for the repo     |

GitDeck is not affiliated with or endorsed by any linked service. Names are used only to say
where a link goes, and each one's `brand` is shown on its card so the provider is never hidden.

### Stack, and why

| Choice                               | Reason                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[WXT](https://wxt.dev)**           | Generates a correct MV3 manifest per browser from one config, and ships dev-mode hot reload. The alternative is hand-maintaining divergent Chrome and Firefox manifests, which is exactly the kind of busywork that kills small extension projects.                                                        |
| **Svelte 5**                         | The popup is a list that reacts to one piece of state. Svelte compiles to direct DOM updates with no runtime framework shipped, which keeps the whole extension around 72 KB and opening instantly. React would add roughly 45 KB of runtime for a UI this small; the choice is about weight, not fashion. |
| **TypeScript (strict)**              | The registry is the product. Strict types plus `validateTool` mean a malformed tool entry fails CI rather than the popup. Pinned to 5.9 because `typescript-eslint` does not yet support TypeScript 7.                                                                                                     |
| **Vitest**                           | The URL logic is pure functions with no DOM. Vitest runs them in milliseconds and shares Vite's config with the build.                                                                                                                                                                                     |
| **No backend, storage or analytics** | Every feature in scope is a string transformation. Adding infrastructure would add privacy obligations and maintenance cost for no user benefit.                                                                                                                                                           |

### Non-goals

No backend. No accounts. No database. No authentication. No analytics. No repository content
access. No reimplementation of any linked service.

## 2. Core user flow

```
User is on github.com/facebook/react
  │
  ├─ clicks the GitDeck action
  │     └─ browser grants activeTab for this tab only
  │
  ├─ popup reads tab.url
  │     └─ parseGitHubRepo(url) → { owner: 'facebook', repo: 'react' }
  │        └─ null? → popup asks the user to paste a repository URL
  │
  ├─ resolveTools(TOOLS, repo) → { resolved, skipped }
  │     ├─ resolved: tool + destination URL, grouped by category
  │     └─ skipped:  tools whose status or required fields rule them out
  │
  ├─ user filters (/), navigates (↑ ↓) and activates (Enter or click)
  │
  └─ browser.tabs.create({ url }) opens the destination
```

If the user is on a file (`/blob/main/src/index.ts`), the parsed reference also carries `ref` and
`path`, and file-scoped tools such as Git History become available. On a repository root they are
skipped with a reason rather than shown broken.

## 3. Supported browsers

| Browser | Target                                                         | Status                                                                      |
| ------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Chrome  | `chrome-mv3`                                                   | Supported, primary development target                                       |
| Edge    | `edge-mv3`                                                     | Supported, same build as Chrome                                             |
| Firefox | `firefox-mv3`                                                  | Supported, separate build (`browser_specific_settings`, no data collection) |
| Safari  | via `xcrun safari-web-extension-converter` on the Chrome build | Planned, Phase 4                                                            |

WXT produces each target from one `wxt.config.ts`. The application code uses the promise-based
`browser.*` API from `wxt/browser`, which is polyfilled for Chrome, so no per-browser branching
exists in the source.

Safari is not in the first release because it requires an Apple Developer account and an Xcode
build step; the conversion path is documented in the roadmap so it is not a surprise later.

## 4. Extension architecture

GitDeck is a **popup plus options page** extension. There is no background service worker and no
content script, because nothing needs to run when the popup is closed.

```
src/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html          WXT entrypoint
│   │   ├── main.ts             mounts the Svelte app
│   │   └── App.svelte          view state, filtering, keyboard handling
│   └── options/
│       ├── index.html          opens in a full tab, not the embedded dialog
│       ├── main.ts             mounts the Svelte app
│       └── App.svelte          available ↔ your deck, dragged across; open target
├── components/
│   ├── RepoHeader.svelte       owner/repo, ref/path, "Change"
│   ├── RepoPrompt.svelte       manual URL entry fallback
│   ├── ToolDeck.svelte         the chosen tools, in stack order
│   └── ToolCard.svelte         one tool, one action
├── lib/
│   ├── browser/active-tab.ts   the only place that touches browser.*
│   ├── github/
│   │   ├── types.ts            RepoRef
│   │   └── parse-repo.ts       URL → RepoRef
│   ├── settings/
│   │   ├── types.ts            Settings, OpenTarget
│   │   ├── settings.ts         defaults and normalisation, pure
│   │   ├── store.ts            read and write browser.storage.sync
│   │   └── index.ts            public surface of the settings module
│   └── tools/
│       ├── types.ts            ToolDefinition, ToolCategory, ToolStatus
│       ├── registry.ts         the data
│       ├── categories.ts       category labels, deck order and section colour
│       ├── stack.ts            the user's chosen tools, as functions over ids
│       ├── template.ts         URL template engine
│       ├── filter.ts           free-text search over resolved tools
│       ├── keyboard.ts         keypress → deck action
│       ├── resolve.ts          registry + RepoRef → deck, plus validateTool
│       └── index.ts            public surface of the tools module
├── styles/theme.css            design tokens, light and dark
└── public/icon/                generated PNGs
```

Dependency direction is one-way: `components` → `lib`, never the reverse. `lib/github` and
`lib/tools` import nothing from the extension or the DOM, which is why they are testable in a
plain Node environment.

## 5. UI architecture

A single stateful component (`App.svelte`) and four presentational ones. State is Svelte 5 runes;
there is no store layer because there is one screen and no cross-component state to share.

```
App.svelte
  view          { loading } | { repo } | { prompt }
  filter        string
  selectedIndex number
  settings      Settings          loaded from storage, defaults until it arrives
       │
       ├─ RepoHeader    (repo, onchange)
       ├─ RepoPrompt    (message, onresolve)
       └─ ToolDeck      (entries, selectedId, onopen)
             └─ ToolCard (entry, selected, shortcut, onopen)
```

Props flow down, callbacks flow up. No component imports the registry directly except through the
resolved entries it is handed, so the UI cannot develop tool-specific behaviour by accident.

**Design constraints.** 384 px wide, 600 px maximum height, scrolling confined to the deck so the
header and footer stay fixed. All colour is CSS custom properties in `styles/theme.css` with a
`prefers-color-scheme` dark variant — no theme toggle, no JavaScript involved in theming.

**Keyboard model.** `/` focuses the filter, `↑`/`↓` move the selection with wraparound, `1`–`9`
open a card directly, `Enter` opens the selection, `Escape` clears the filter. The mapping lives
in `lib/tools/keyboard.ts` as a pure function so the whole model is tested without a DOM. Keys
with a modifier are never intercepted, and while the filter has focus the number keys yield to
plain typing. The selected card scrolls into view. Every card is a real `<button>`, so tab order and
screen readers work without ARIA patching.

**The stack.** The registry is the source; the stack is the selection. `Settings.stack` is one
list of tool ids in the order the user dragged them, and the popup shows exactly those tools that
apply to the current page, flat, in that order — so `1` is always the first tool the user put in
their deck. Nothing outside the stack appears. The operations live in `lib/tools/stack.ts` as
functions over ids: `pickStack` selects and orders, `placeInStack` adds or moves a tool before a
named neighbour (anchoring on an id rather than an index, so a drop lands where the user saw it
whichever way it moved), `nudgeInStack` is the keyboard equivalent, and `reconcileStack` drops ids
the registry no longer has. New registry entries never join a stack on their own. An empty stack
is the first-run state. The popup offers the recommended deck — the one tool per section marked
`recommended` in the registry, chosen by `recommendedStack` — or sends the user to the options
page, whose empty deck panel doubles as the welcome and offers the same one-click start.

**Section icons.** Each section has an icon and a tint, both declared in `categories.ts`: the icon
as stroke path data on a 24 × 24 grid, the tint as a CSS custom property defined for light and
dark in `theme.css`. `CategoryIcon.svelte` draws the icon in the tint on every card and beside each
heading on the options page. The icon carries the meaning and the colour reinforces it, so no
state is signalled by colour alone.

**Settings.** The stack, three open targets — a new tab, this tab, or a background tab — and the unverified
toggle, persisted to `browser.storage.sync` as one object. `this tab` is the case the rest of the
design exists for: you are on a repository, and you want to be looking at the same repository
somewhere else. A background tab is the only target that leaves the popup open, so several tools
can be opened in a row. Storage is treated as untrusted input: `normaliseSettings` falls back
field by field, so a value written by an older version cannot reset the others or crash the
popup.

## 6. Tool registry architecture

A tool is a plain data object. `ToolDefinition` (`src/lib/tools/types.ts`):

| Field         | Required | Purpose                                                       |
| ------------- | -------- | ------------------------------------------------------------- |
| `id`          | yes      | Stable kebab-case identifier, never reused or renamed         |
| `name`        | yes      | Card title: the job, led by a verb                            |
| `brand`       | yes      | The service's own name, shown as provenance                   |
| `description` | yes      | One imperative sentence: what the user gets                   |
| `category`    | yes      | Deck grouping                                                 |
| `urlTemplate` | yes      | The transformation: a URL to open, or text to copy            |
| `action`      | no       | `open` (default) or `copy`                                    |
| `recommended` | no       | This section's pick for the recommended deck; one per section |
| `website`     | yes      | Provenance                                                    |
| `status`      | yes      | `verified` \| `unverified` \| `deprecated`                    |
| `verifiedAt`  | yes      | ISO date the template was last checked                        |
| `requires`    | no       | Repository fields beyond owner/repo (`ref`, `path`)           |
| `docsUrl`     | no       | Documentation or source for the tool itself                   |
| `notes`       | no       | Caveats surfaced on the card                                  |

The registry is a frozen array in one file. There is no per-tool module and no plugin system:
sixteen data objects do not need either, and a flat array is the form a contributor can edit
without reading any documentation first.

**Why `status` exists.** Third-party services disappear. Rather than deleting an entry the moment
a check fails, an entry is demoted. `verified` ships by default; `unverified` is hidden behind a
checkbox; `deprecated` is never shown. This gives a graceful path between "working" and "gone"
and keeps the reason in version control.

**Registry invariants are tested, not documented.** `validateTool` checks id casing, HTTPS-only
URLs for tools that open, ISO dates, placeholder names, and agreement between `requires` and the template.
`registry.test.ts` runs it over every entry and resolves every entry against a full reference. A
malformed tool fails CI.

## 7. URL transformation architecture

Two pure functions, no per-tool code.

### Parsing — `parseGitHubRepo(input): RepoRef | null`

Accepts full HTTPS URLs, scheme-less URLs, `http://`, `www.`, `.git` suffixes, SSH remotes
(`git@github.com:owner/repo.git`), query strings, fragments, and deep links
(`/tree/<ref>/<path>`, `/blob/<ref>/<path>`).

Rejection is as important as acceptance. The parser returns `null` for non-GitHub hosts,
lookalike hosts (`github.com.evil.com`), gists, and GitHub's own site pages — `/settings`,
`/marketplace`, `/orgs`, `/topics` and the rest are held in a reserved-owner set, because
`github.com/settings/profile` is otherwise indistinguishable from a repository. Owner and
repository names are validated against GitHub's actual rules (39-character owners, no leading or
doubled hyphens, 100-character repository names).

### Templating — `renderTemplate(template, values): string`

Placeholders are `{name}` or `{name|modifier}`:

| Modifier        | Behaviour                                            | Example use                   |
| --------------- | ---------------------------------------------------- | ----------------------------- |
| `enc` (default) | `encodeURIComponent`                                 | `{owner}`, `{repo}`           |
| `path`          | encodes each `/`-separated segment, keeps separators | `{path\|path}`                |
| `raw`           | verbatim                                             | branch names in path position |

Everything else in the template is literal, so a tool needing an encoded separator writes
`{owner}%2F{repo}` (deps.dev) and one needing a fragment writes `#{owner}/{repo}`
(Star History). No tool has needed a code path of its own.

Missing values and unknown modifiers throw `TemplateError` rather than producing a plausible but
wrong URL.

### Resolving — `resolveTools(tools, repo, options)`

Filters by status, checks `requires` against the available fields, renders, then re-parses the
result and rejects anything that is not HTTPS. A `copy` tool skips the URL check: its rendered
template is text for the clipboard, such as a clone command, and the popup writes it with
`navigator.clipboard` on the click or keypress that picked it — a user gesture, so no clipboard
permission is needed. Returns `{ resolved, skipped }` where every skip
carries a reason. **Nothing throws.** One broken entry costs one card, never the deck — this is
the mechanism behind the "handle tools becoming unavailable without breaking" requirement.

## 8. Security and privacy model

**Permissions.** `activeTab` and `storage`. No `host_permissions`, no `tabs`, no `scripting`.
`activeTab` is granted by the browser for the current tab at the moment the user clicks the
action, and revoked on navigation; it is what allows `browser.tabs.update` to send that tab
somewhere else. `storage` holds preferences and nothing else.

**Data.** GitDeck reads one string — the active tab's URL — and holds it in popup memory until
the popup closes. The only thing ever written is the settings object: the stack of tool ids, an
open target and one boolean. It lives in `storage.sync`, so the browser's own sync, when the user
has turned it on, copies it between devices through their Google, Microsoft or Mozilla account.
No URL, repository name or history is stored, logged or transmitted, and there is no first-party
network traffic of any kind. [`docs/privacy.md`](privacy.md) is the user-facing policy and the URL
given to the stores; a change here must change it too.

**Availability.** Dead tools are found by `scripts/check-links.ts`, which runs weekly in CI and
never in the extension. Checking at runtime would mean the popup contacting every service in the
registry on open — which is exactly the thing the inline section icons and the missing host
permissions exist to prevent, and it would tell a dozen third parties which repository you are
looking at for the sake of greying out a card. The script reports; a human sets `status` in the
registry; the popup shows only what the registry vouches for.

A success status is not enough on its own: a lapsed domain that someone else registers still
answers 200. So each destination must also contain an expected piece of text, listed in `EXPECT`
in the script: the repository name where the service renders it on the server, otherwise the
service's own name. That catches a parked or squatted domain. It cannot prove a client-rendered
app shows the right repository, which remains a manual check.

**Third parties.** The popup issues no requests to the listed services. Card icons are inline SVG
drawn from path data in the bundle, never favicons, specifically so that opening the deck does not leak the repository name to every
service in the registry via favicon fetches. The only third-party contact is the tab the user
deliberately opens. From that point the repository name is in the destination URL, and the
service's own privacy policy and terms apply; GitDeck has no part in what happens there.

**Injection surface.** Owner and repository names are percent-encoded before substitution, so a
crafted repository name cannot break out of its URL position. Every resolved URL is re-parsed and
must be `https:`, which blocks `javascript:` and `data:` destinations even if a registry entry
were compromised. Templates are checked at build time by the registry test, and the extension
ships no `eval`, no remote code and no inline scripts.

**Supply chain.** Dependencies are development-only; nothing from `node_modules` other than the
Svelte-compiled output reaches the published bundle.

## 9. Testing strategy

| Layer               | Tool              | What is covered                                                                                                                      |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| URL parsing         | Vitest            | Supported formats, refs and paths, invalid and hostile input, GitHub name rules                                                      |
| Template engine     | Vitest            | Substitution, all three modifiers, repeated placeholders, error cases                                                                |
| Resolution          | Vitest            | Each URL shape (path, query, fragment, encoded separator), `requires` gating, HTTPS enforcement, status filtering, graceful skipping |
| Registry            | Vitest            | Unique ids and names, known categories, `validateTool` over every entry, every entry resolves, unverified entries carry notes        |
| Types               | `svelte-check`    | Strict TypeScript across `.ts` and `.svelte`                                                                                         |
| Style               | ESLint + Prettier | Flat config with `typescript-eslint` and `eslint-plugin-svelte`                                                                      |
| Component behaviour | _not yet_         | Planned for Phase 5 (`vitest-browser-svelte`)                                                                                        |
| End to end          | _not yet_         | Planned for Phase 5 (Playwright, loading the built extension)                                                                        |

Current suite: 150 tests over seven files, running in well under a second. The deliberate
consequence of keeping all logic in pure functions is that the valuable tests need no DOM and no
browser.

`npm run check` runs types, lint, format and tests — the same command CI runs.

## 10. Distribution strategy

| Store            | Package                                                   | Notes                                                                                 |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Chrome Web Store | `npm run zip` → `.output/*-chrome.zip`                    | One-off developer registration fee                                                    |
| Edge Add-ons     | same artefact as Chrome                                   | Free registration                                                                     |
| Firefox Add-ons  | `npm run zip:firefox` (produces an extra sources zip)     | Free; AMO requires reproducible sources, which is why the build has no bundler tricks |
| Safari           | `xcrun safari-web-extension-converter .output/chrome-mv3` | Requires macOS, Xcode and a paid Apple Developer account; deferred                    |

Releases will be tagged, built in CI from the tag, and published from the artefacts, so a
published build is always reproducible from a commit. Store listings will carry the same
permission justification as this document.
