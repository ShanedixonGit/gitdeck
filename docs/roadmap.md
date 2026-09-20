# Roadmap

Seven phases. Each one ends with something that works; none of them is a rewrite of the last.
Phases 1–3 are largely complete — the current state is a working skeleton, not a finished
product.

## Phase 1 — Foundation _(done)_

- [x] WXT + Svelte 5 + TypeScript project, strict compiler settings
- [x] ESLint flat config, Prettier, Vitest
- [x] Minimal MV3 manifest: `activeTab` only, no background worker, no content scripts
- [x] `parseGitHubRepo` covering HTTPS, scheme-less, SSH, `.git`, refs, paths and deep links
- [x] Template engine with `enc` / `path` / `raw` modifiers
- [x] Resolver that never throws and reports why a tool was skipped
- [x] Generated extension icons
- [x] Chrome and Firefox builds

## Phase 2 — UI _(mostly done)_

- [x] Popup shell with detected repository, filter, grouped deck and footer
- [x] Tool cards with monogram, description, caveats and status badge
- [x] Manual URL entry when the tab is not a repository
- [x] Dark mode via `prefers-color-scheme`, tokens in one file
- [x] Keyboard model: `/`, `↑`/`↓`, `Enter`, `Escape`
- [ ] Number shortcuts (`1`–`9`) for the first results
- [ ] Loading, empty and error states given the same care as the happy path
- [ ] Reduced-motion and high-contrast handling
- [ ] Accessibility pass with a screen reader

## Phase 3 — Tool registry _(done for now)_

- [x] `ToolDefinition` with status and `verifiedAt`
- [x] 16 entries, each verified or explicitly marked unverified
- [x] Rejected candidates documented with dated reasons
- [x] `validateTool` invariants enforced in CI
- [ ] Expand to 20–25 entries as new tools are verified
- [ ] File-scoped and directory-scoped sections (GitZip, download-directory)

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
- [ ] A scripted registry link-check, run on demand and reported rather than auto-committed

## Phase 6 — Polish

- [ ] `storage` permission (added only here, when there is a reason) for: favourites pinned to
      the top, recently used tools, remembering the unverified toggle
- [ ] Keyboard shortcut to open the popup (`commands` in the manifest)
- [ ] Copy the transformed URL instead of opening it
- [ ] Optional omnibox keyword (`gd react` → deck for the repository)
- [ ] Options page for hiding tools the user does not want
- [ ] Screenshots and a short demo in the README

## Phase 7 — Distribution

- [ ] Release checklist: verification sweep, version bump, changelog
- [ ] CI that builds and attaches store artefacts on a tag
- [ ] Chrome Web Store listing and permission justification
- [ ] Edge Add-ons listing (same artefact)
- [ ] Firefox Add-ons listing, including the sources archive AMO requires
- [ ] Safari, if the Apple Developer account is worth it at that point
- [ ] Privacy policy page that says, accurately, that no data is collected

## Explicitly out of scope

A backend. Accounts. A database. Telemetry of any kind. Reimplementing any linked service.
Reading repository contents. Anything that would turn a URL rewriter into a platform.
