# Store listing

The text submitted to each store, kept here so every listing says the same thing and changes go
through review like code. Repohopper is described as a connector throughout: the linked tools are
independent services, and nothing here presents their features as Repohopper's.

Privacy policy URL, for every store:
`https://github.com/ShanedixonGit/repohopper/blob/main/docs/privacy.md`

Homepage and support URL: `https://github.com/ShanedixonGit/repohopper`

## Name

Repohopper

## Short description

The manifest `description`, 132 characters at most. Chrome shows it on the listing tile.

> Opens the GitHub repository you are looking at in other tools, each run by its own provider.

## Long description

> Repohopper connects the GitHub repository you are looking at to other tools that can open it.
>
> Click the Repohopper icon on any repository and you get your deck: links to the services you
> chose, each already pointed at that repository. One click, or one number key, takes you there.
>
> What Repohopper does itself:
>
> - works out the repository, branch and file from the address of the tab you are on
> - builds the right link for each tool, and the clone commands it copies for you
> - keeps your deck: the tools you picked, in your order, with keys 1 to 9
>
> Where it can send you includes browser editors (GitHub.dev, StackBlitz, Codespaces), generated
> documentation (DeepWiki), diagrams (GitDiagram, Git History), AI context (GitIngest, GitMCP),
> project insights (OSS Insight, Star History), dependency and security reports (deps.dev,
> OpenSSF Scorecard) and GitHub code search. You can also copy a clone command or download a ZIP.
>
> Each of these is a separate service, run by its own provider under its own terms and privacy
> policy. Repohopper is not affiliated with any of them and does not reproduce what they do.
>
> Privacy: Repohopper reads the address of the current tab only when you click its icon, stores
> nothing but your settings, and makes no network requests of its own. No tracking, no
> analytics, no accounts.
>
> Open source, MIT licensed.

## Category

- Chrome Web Store: Developer Tools
- Edge Add-ons: Developer tools
- Firefox Add-ons: Web Development

## Single purpose (Chrome)

> Open the GitHub repository in the current tab in other web tools the user has chosen, by
> building a link to each tool for that repository.

## Permission justifications

**activeTab**

> Read the address of the current tab when the user clicks the Repohopper icon, to find the GitHub
> repository they are viewing and build links for it. It is also what lets Repohopper open a chosen
> tool in the current tab. No page content is read, and no access is kept after the popup closes.

**storage**

> Save the user's settings: which tools are in their deck and in what order, where tools open, and
> whether to show tools that could not be verified automatically. Nothing else is stored.

**Host permissions:** none requested.

**Remote code:** none. All code is bundled with the extension; there is no `eval` and no script is
loaded from the network.

## Data use (Chrome privacy practices tab)

Collects none of the listed categories of user data. Certify all three statements: data is not
sold to third parties, not used or transferred for purposes unrelated to the single purpose, and
not used or transferred to determine creditworthiness or for lending.

Firefox: the manifest declares `data_collection_permissions: { required: ['none'] }`.

## Firefox source code submission

AMO requires the source for bundled code. Upload the archive from `npm run zip:firefox`
(`.output/repohopper-<version>-sources.zip`) with these reviewer notes:

> Built with WXT and Svelte. To reproduce the submitted package, with Node 22 or newer:
>
> ```
> npm ci
> npm run build:firefox
> ```
>
> The output is in `.output/firefox-mv3`. The `innerHTML` warning from the linter is Svelte's
> runtime creating templates from static strings compiled into the bundle; no user or page data
> reaches it.

## Screenshots

`npm run screenshots` renders them from the built extension into `docs/images/store/`: 1280×800
JPEG, since the Chrome Web Store rejects PNGs with an alpha channel. Rerun it before each release
so the listing matches what ships. Chrome takes up to five, Edge up to ten, Firefox any number.

1. `1-deck.jpg` — the popup on a repository, showing the recommended deck
2. `2-first-run.jpg` — first run: "Use the recommended deck" or "Choose my own"
3. `3-copy.jpg` — a clone command just copied
4. `4-options.jpg` — the options page with both panels

It drives the installed Google Chrome through `playwright-core`, so it downloads no browser.

## Store images

| File                  | Store                                                             | Made by               |
| --------------------- | ----------------------------------------------------------------- | --------------------- |
| `icon-128-chrome.png` | Chrome: store icon, 96 px artwork in 16 px of transparent padding | `npm run icons`       |
| `icon-300-edge.png`   | Edge: extension logo                                              | `npm run icons`       |
| `promo-440x280.jpg`   | Chrome: small promo tile                                          | `npm run screenshots` |

All in `docs/images/store/`. Firefox takes its icon from the manifest.
