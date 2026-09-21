# Changelog

All notable changes to GitDeck are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The extension takes its version from `package.json`; WXT copies it into every manifest, so that
field is the single source of truth. Until 1.0.0 the minor number moves for user-visible change
and the patch number for fixes.

## [Unreleased]

### Added

- Favourites: star a tool to pin it to a section above the deck, which also gives it a low number
  shortcut
- An options page, opened in a full tab, for arranging the deck: star, reorder within a section,
  and hide tools you never use
- A welcome panel on first run, showing what the deck can do rather than assuming it is obvious
- A colour per section, on the heading dot and the card monogram, so the shape of the deck is
  readable at a glance. Colour is never the only signal for anything
- `npm run check:links`, and a weekly CI job that opens an issue when a tool marked `verified`
  stops responding

### Changed

- **One tool per job.** Dropped GitHub1s (GitHub.dev does the same and can commit), Bolt and
  CodeSandbox (StackBlitz does the same without an account) and grep.app (GitHub code search does
  the same and was verified). 17 entries down to 13, all verified, and `docs/tools.md` records
  what lost and why so the same candidates are not re-added later
- The popup's settings panel keeps only the open target and a way through to the options page

### Known issues

- The deck shows every tool with favourites pinned above them. It should show only the tools you
  chose — see Phase 3.5 in [docs/roadmap.md](docs/roadmap.md)
- "Open tools in" appears in both the popup settings panel and the options page

## [0.2.0] — 2026-09-21

The first build that actually loads in a browser.

### Added

- Settings panel choosing where a tool opens: a new tab, the tab you are already on, or a
  background tab that leaves the popup up so several tools can be opened in a row
- The open target and the "show unverified" toggle persist between sessions, in
  `browser.storage.sync`
- Deck sections by category, and `1`–`9` shortcuts that follow what is on screen rather than
  registry order
- A visible message when the browser refuses to open a tool, which is otherwise a click that
  silently does nothing
- `prefers-reduced-motion` handling

### Fixed

- **The extension could not be loaded at all.** `publicDir` resolves against the project root
  rather than `srcDir`, so the icons were never copied into the build while the manifest went on
  declaring them. Chrome rejected the result with `Could not load icon 'icon/16.png'`, and
  `wxt build` reported success throughout. A test now checks every declared icon exists on disk.
- `npm run dev` printed "load it manually" instead of opening a browser, because WXT's optional
  `web-ext` peer was not installed.

### Changed

- Manifest now requests `storage` alongside `activeTab`, solely to hold the two preferences
- README rewritten for a first-time reader; the stack rationale moved into
  `docs/architecture.md`

## [0.1.0] — 2026-09-20

### Added

- WXT + Svelte 5 + TypeScript foundation, strict compiler settings, ESLint, Prettier, Vitest, CI
- `parseGitHubRepo`, covering HTTPS, scheme-less, SSH, `.git`, refs, paths and deep links, and
  rejecting GitHub site pages and lookalike hosts
- URL template engine with `enc`, `path` and `raw` modifiers
- Resolver that reports why a tool was skipped instead of throwing
- Registry of 16 tools, each verified or explicitly marked unverified
- Popup UI with detected repository, filter, grouped deck, manual URL entry and dark mode
