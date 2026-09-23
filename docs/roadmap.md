# Roadmap

Seven phases. Each one ends with something that works; none of them is a rewrite of the last.
Phases 1–3.5 are done. What stands between the current state and a public release is Phase 4
(proving it in Firefox and Edge) and Phase 7 (the store submissions).

## Phase 1 — Foundation _(done)_

- [x] WXT + Svelte 5 + TypeScript project, strict compiler settings
- [x] ESLint flat config, Prettier, Vitest
- [x] Minimal MV3 manifest: `activeTab` only, no background worker, no content scripts
- [x] `parseGitHubRepo` covering HTTPS, scheme-less, SSH, `.git`, refs, paths and deep links
- [x] Template engine with `enc` / `path` / `raw` modifiers
- [x] Resolver that never throws and reports why a tool was skipped
- [x] Generated extension icons
- [x] Chrome and Firefox builds

## Phase 2 — UI _(done, bar an accessibility pass)_

- [x] Popup shell with detected repository, filter, grouped deck and footer
- [x] Tool cards with section icon, description, caveats and status badge
- [x] Manual URL entry when the tab is not a repository
- [x] Dark mode via `prefers-color-scheme`, tokens in one file
- [x] Keyboard model: `/`, `↑`/`↓`, `Enter`, `Escape`
- [x] Number shortcuts (`1`–`9`) for the first results
- [x] Loading, empty and error states given the same care as the happy path
- [x] Reduced-motion handling
- [x] Where tools open, and the unverified toggle, both remembered (now on the options page)
- [ ] High-contrast handling
- [ ] Accessibility pass with a screen reader

## Phase 3 — Tool registry _(done for now)_

- [x] `ToolDefinition` with status and `verifiedAt`
- [x] 17 entries, each verified or explicitly marked unverified
- [x] Rejected candidates documented with dated reasons
- [x] `validateTool` invariants enforced in CI
- [x] One tool per job, with the rejected duplicates and reasons recorded
- [ ] Expand the registry only where a tool does something none of the current 17 does
- [ ] File-scoped and directory-scoped sections (GitZip, download-directory)

## Phase 3.5 — The deck is a chosen stack

Raised on 2026-09-21, after running 0.2.0 in a browser for the first time. The current design
shows all 13 tools and pins favourites above them. That is a catalogue with a shortcut, not a
deck. The deck should be the tools you picked.

- [x] The popup shows only the tools the user has chosen. Nothing unchosen appears
- [x] `favourites` and `hidden` collapse into one chosen list: the registry is the source, the
      stack is the selection
- [x] The options page becomes two panels — everything available on one side, your stack on the
      other — and you drag tools across. Up and down arrows go
- [x] An empty stack is the first-run state, so the welcome panel and the picker are the same
      screen rather than two
- [x] Drop the coloured dot beside each section heading. Section colour stays, delivered some
      other way
- [x] Tool names say what the tool is for. "GitHub.dev" and "deps.dev" are brands, not jobs —
      the card should lead with the job and keep the brand as provenance
- [x] "Open tools in" lives in exactly one place. It is currently in both the popup settings
      panel and the options page

## Phase 4 — Browser compatibility

- [ ] Verify the Firefox build end to end in a real profile
- [ ] Verify the Edge build
- [ ] Safari: `xcrun safari-web-extension-converter`, document the Xcode steps and limits
- [ ] Popup sizing checked across browsers and OS zoom levels
- [ ] Confirm `activeTab` behaves identically on all three engines

## Phase 5 — Testing

- [ ] Component tests with `vitest-browser-svelte` (filtering, keyboard navigation, empty states)
- [ ] Playwright end-to-end test that loads the built extension, opens the popup on a real
      GitHub page and asserts the destination URL
- [ ] Coverage reporting on `src/lib`, with a floor in CI
- [x] A scripted registry link-check, run on demand and weekly in CI, reported rather than
      auto-committed, and checking each destination's content as well as its status

## Phase 6 — Polish

- [x] `storage` permission, added when there was a reason: remembering the open target and the
      unverified toggle
- [x] ~~Favourites pinned to the top~~ — replaced by the chosen stack (Phase 3.5)
- [ ] Recently used tools
- [ ] Keyboard shortcut to open the popup (`commands` in the manifest)
- [ ] Copy the transformed URL instead of opening it
- [ ] Optional omnibox keyword (`gd react` → deck for the repository)
- [x] Options page for choosing and ordering the stack
- [x] Screenshots in the README and the store listings, from `npm run screenshots`

## Phase 7 — Distribution

- [ ] Release checklist: verification sweep, version bump, changelog
- [ ] CI that builds and attaches store artefacts on a tag
- [x] Chrome Web Store listing and permission justification, in `docs/store-listing.md`
- [ ] Edge Add-ons listing (same artefact)
- [ ] Firefox Add-ons listing, including the sources archive AMO requires
- [ ] Safari, if the Apple Developer account is worth it at that point
- [x] Privacy policy page that says, accurately, that no data is collected, and that each linked
      service's own policy applies once the user opens it
- [x] Store descriptions that present GitDeck as a connector to independent services, with no
      claim of affiliation and no feature of a linked service described as GitDeck's

## Explicitly out of scope

A backend. Accounts. A database. Telemetry of any kind. Reimplementing any linked service.
Reading repository contents. Anything that would turn a URL rewriter into a platform.
