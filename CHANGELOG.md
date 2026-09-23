# Changelog

All notable changes to Repohopper are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The extension takes its version from `package.json`; WXT copies it into every manifest, so that
field is the single source of truth. Until 1.0.0 the minor number moves for user-visible change
and the patch number for fixes.

## [Unreleased]

### Added

- **Undo** after resetting or emptying your deck on the options page
- The options page follows changes made in the popup or another tab while it is open
- After **Change**, a link back to the repository the tab is on
- `npm run test:e2e`: the built popup and options pages tested in headless Chrome, in CI too.
  `npm run screenshots` shares its harness
- A privacy policy, `docs/privacy.md`, for the store listings. The README and architecture notes
  now list every stored setting and say that they sync through the browser's account
- An options page, opened in a full tab, with two panels: every available tool, and your deck.
  Drag tools across to add or remove them and within your deck to reorder. An empty deck is the
  first-run state, so the welcome and the picker are one screen
- An icon and a colour per section on every card, replacing the letter monogram, so the shape of the deck is readable at a glance.
  Colour is never the only signal for anything
- **Get the code**: copy a clone command for HTTPS, SSH or the GitHub CLI, or download a ZIP.
  Copy tools put text on the clipboard instead of opening a page
- A recommended deck, the best tool from each section, one click away on first run and on the
  options page
- `npm run check:links`, and a weekly CI job that opens an issue when a tool marked `verified`
  stops responding. It checks every website and docs link the extension shows, not only each
  tool's destination

### Changed

- **GitDeck is now Repohopper.** Git's trademark policy does not allow "Git" as part of another
  product's name, and an active project in the same space already uses GitDeck. The Firefox
  add-on ID changes with it, to `repohopper@shanedixon.dev`. Nothing was published under the old
  name, so there is nothing installed to migrate
- Firefox 140 or newer is required (142 on Android), the first releases that read the manifest's
  declaration that Repohopper collects no data. The Firefox-only manifest keys are no longer in the
  Chrome and Edge builds, which warned about them
- The README, docs and extension description now say plainly that Repohopper is a connector: the
  linked tools are independent services, not affiliated with Repohopper, and their features,
  accuracy, accounts and privacy policies are theirs. What Repohopper does itself is listed
  separately
- **The deck is the tools you chose.** The popup shows only your stack, as one list in the order
  you set, and 1–9 follow that order. Nothing you did not pick appears
- Tool names say what the tool does ("Browse in VS Code"), with the brand ("GitHub.dev")
  underneath as provenance
- The supply chain section is now **Security & dependencies**, which is what it holds
- "Open tools in" moved from the popup's settings panel to the options page, and the panel is gone
- **One tool per job.** Dropped GitHub1s (GitHub.dev does the same and can commit), Bolt and
  CodeSandbox (StackBlitz does the same without an account) and grep.app (GitHub code search does
  the same and was verified). 17 entries down to 13, all verified, and `docs/tools.md` records
  what lost and why so the same candidates are not re-added later

### Fixed

- Git History is offered only on a file, not on a folder, where it has nothing to show
- Settings are saved as a plain copy. Choosing the recommended deck in the popup handed storage a
  Svelte state proxy, which Chrome accepts but a structured-clone storage, as in Firefox, refuses
- GitHub's own pages, such as `/copilot`, `/models` and `/readme`, are no longer mistaken for
  repositories
- The popup no longer flashes "None of your tools apply to this page" before your deck appears.
  It waits for your settings as well as the tab
- Reordering quickly on the options page no longer loses the result. The browser caps sync writes
  at about two a second and dropped the rest silently; a burst of changes is now saved once it
  settles, and a write the browser refuses is reported on the page
- Enter activates whatever has focus. Tabbing to **Change** or **Customise** and pressing Enter
  used to open the selected tool instead, and a card reached with Tab opened the highlighted one
  rather than itself. The arrow keys now carry focus along with the highlight

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
