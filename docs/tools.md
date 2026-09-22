# Tool registry

The registry lives in [`src/lib/tools/registry.ts`](../src/lib/tools/registry.ts). This document
records how each entry was verified and — just as importantly — which candidates were rejected
and why.

**Last verification sweep: 2026-09-23** — all 17 entries, and every website and docs link the
extension shows, reachable. Checked by `npm run check:links`.

## Verification method

For every candidate:

1. Request the transformed URL for a known repository (`facebook/react`) with a browser
   user-agent, following redirects.
2. Confirm the response is a success status and the returned page refers to the requested
   repository (page `<title>` or body content), rather than a generic landing page, a sign-in
   wall or an error.
3. Record the transformation pattern and categorise the tool.
4. Set `verifiedAt` to the date of the check.

A candidate that could not be confirmed is either recorded as `unverified` with the reason, or
excluded and listed below. **No entry is included on the strength of it having worked in the
past.**

## One tool per job

Where two services do the same thing, the registry carries one of them. A launcher that offers
three ways to open the same repository in the same kind of editor has moved the choosing onto the
user, which is the problem it was meant to solve.

| Kept               | Dropped           | Why                                                                                                                                                                                |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub.dev         | GitHub1s          | Both are VS Code in the browser. GitHub.dev is GitHub's own, and can edit and commit; GitHub1s is read-only                                                                        |
| StackBlitz         | Bolt, CodeSandbox | All three run the project in the browser. StackBlitz needs no account; Bolt is a StackBlitz product gated on sign-in and credits, and CodeSandbox never passed the automated check |
| GitHub Code Search | grep.app          | Both search the repository. Code search is already where the user is, needs no third party, and was verified                                                                       |

Removed on 2026-09-21. Each remains a fine service — this is about the size of the deck, not their
quality. The reasoning belongs here so the same candidates are not re-added later.

## Shipped — verified (17)

| Tool                                                 | Category                | Transformation                                           | Verified by                                                                                                      |
| ---------------------------------------------------- | ----------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [GitHub.dev](https://github.dev)                     | Editor                  | `github.dev/{owner}/{repo}`                              | 200 after redirect to the VS Code web host                                                                       |
| [StackBlitz](https://stackblitz.com)                 | Editor                  | `stackblitz.com/github/{owner}/{repo}`                   | 200, `<title>Facebook - React - StackBlitz</title>`                                                              |
| [Codespaces](https://github.com/features/codespaces) | Editor                  | `github.com/codespaces/new?repo={owner}%2F{repo}`        | 302 to GitHub sign-in; GitHub's own documented entry point. Carries a "requires a signed-in GitHub account" note |
| Clone over HTTPS                                     | Get the code            | copies `git clone https://github.com/{owner}/{repo}.git` | Copy tool: no page to reach. The command is GitHub's documented HTTPS remote form                                |
| Clone over SSH                                       | Get the code            | copies `git clone git@github.com:{owner}/{repo}.git`     | Copy tool. GitHub's documented SSH remote form                                                                   |
| [GitHub CLI](https://cli.github.com)                 | Get the code            | copies `gh repo clone {owner}/{repo}`                    | Copy tool. The form in the `gh repo clone` manual                                                                |
| Download a ZIP                                       | Get the code            | `github.com/{owner}/{repo}/archive/HEAD.zip`             | 200, `application/zip` from `codeload.github.com`; `HEAD` follows the default branch                             |
| [DeepWiki](https://deepwiki.com)                     | Understand              | `deepwiki.com/{owner}/{repo}`                            | 200, `<title>facebook/react \| DeepWiki</title>`                                                                 |
| [GitDiagram](https://gitdiagram.com)                 | Visualise               | `gitdiagram.com/{owner}/{repo}`                          | 200, `<title>facebook/react Diagram \| GitDiagram</title>`                                                       |
| [Git History](https://githistory.xyz)                | Visualise               | `github.githistory.xyz/{owner}/{repo}/blob/{ref}/{path}` | 200. File-scoped: declares `requires: ['ref', 'path']`                                                           |
| [GitIngest](https://gitingest.com)                   | AI context              | `gitingest.com/{owner}/{repo}`                           | 200, repository page served                                                                                      |
| [GitMCP](https://gitmcp.io)                          | AI context              | `gitmcp.io/{owner}/{repo}`                               | 200, `<title>GitMCP</title>`                                                                                     |
| [OSS Insight](https://ossinsight.io)                 | Insights                | `ossinsight.io/analyze/{owner}/{repo}`                   | 200, `<title>Analyze facebook/react \| OSSInsight</title>`                                                       |
| [Star History](https://www.star-history.com)         | Insights                | `www.star-history.com/#{owner}/{repo}`                   | 200 on the `www` host (the apex 301s)                                                                            |
| [Open Source Insights](https://deps.dev)             | Security & dependencies | `deps.dev/project/github/{owner}%2F{repo}`               | 200, `<title>Open Source Insights</title>`                                                                       |
| [OpenSSF Scorecard](https://scorecard.dev)           | Security & dependencies | `scorecard.dev/viewer/?uri=github.com/{owner}/{repo}`    | 200, `<title>OpenSSF scorecard report</title>`                                                                   |
| [GitHub Code Search](https://github.com/search)      | Search                  | `github.com/search?q=repo%3A{owner}%2F{repo}&type=code`  | 200, GitHub's own search scoped with the `repo:` qualifier                                                       |

## Shipped — unverified (0)

None. A tool whose automated check turns inconclusive moves here with the reason, and is hidden
until the user ticks the option to offer unverified tools.

## Rejected

Kept here so that nobody re-adds them without new evidence.

| Candidate                                              | Checked    | Outcome                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gitpod**                                             | 2026-09-20 | Gitpod Classic pay-as-you-go was sunset on 2025-10-15 and the product moved to Ona. `gitpod.io/#<url>` still serves a dashboard shell, but the URL-launch flow it depended on is no longer a dependable public entry point. Revisit if Ona publishes a stable repository-URL scheme. |
| **Sourcegraph**                                        | 2026-09-20 | `sourcegraph.com/github.com/{owner}/{repo}` returns 404. The public code-search instance is gone and the product is enterprise-only.                                                                                                                                                 |
| **CodeSee**                                            | 2026-09-20 | `app.codesee.io` sits behind a Cloudflare Access login for an unrelated internal tenant. The public product is gone.                                                                                                                                                                 |
| **Replit**                                             | 2026-09-20 | `replit.com/github/{owner}/{repo}` 302s to a login wall before any import happens. Not usable without an account, so it fails the "publicly accessible" bar.                                                                                                                         |
| **uithub**                                             | 2026-09-20 | `uithub.com/{owner}/{repo}` returns `401 Unauthorized. Authentication required.`                                                                                                                                                                                                     |
| **zread.ai**                                           | 2026-09-20 | Connection failure; the host did not resolve.                                                                                                                                                                                                                                        |
| **Libraries.io**                                       | 2026-09-20 | `libraries.io/github/{owner}/{repo}` now 301s to a nonsensical GitHub URL (`github.com/react/react`). Broken transformation.                                                                                                                                                         |
| **download-directory.github.io**, **GitZip**           | 2026-09-20 | Both are live, but they operate on a _subdirectory_ URL rather than a repository root, so the repository-level transformation GitDeck performs produces a useless page. Candidates for a future file/directory-scoped section.                                                       |
| **emgithub**                                           | 2026-09-20 | Live, but produces an embeddable snippet for a single file — not a destination a user navigates to.                                                                                                                                                                                  |
| **vscode.dev**                                         | 2026-09-20 | Live, but `github.dev/{owner}/{repo}` redirects to exactly this URL. Listing both would put two identical destinations in the deck.                                                                                                                                                  |
| **Refined GitHub**, **Octotree**, **GitHub Hovercard** | 2026-09-23 | Good tools, but browser extensions that change GitHub's own pages rather than destinations a repository URL can point at. GitDeck rewrites URLs; install these alongside it.                                                                                                         |

## Re-verification

The registry is a perishable asset. Until the checker in Phase 6 is automated, run a sweep before
each release:

1. For each entry, request the transformed URL for a well-known repository.
2. Update `verifiedAt` on entries that still pass.
3. Demote failures to `unverified`, or to `deprecated` if the service is gone, and record the
   reason in `notes` and in this document.

Never silently delete an entry — a rejected candidate with a dated reason is more useful to the
next contributor than an absence.
