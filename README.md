# GitDeck

**You're looking at a GitHub repo. GitDeck shows you every other way to look at it.**

Click the icon on any repository and get a deck of tools — browser IDEs, architecture
diagrams, dependency graphs, AI context exporters — each already pointed at the repo
you're on. One click opens it.

<!-- TODO: screenshot of the popup -->

## What you get

|                         |                                    |
| ----------------------- | ---------------------------------- |
| **Open in an editor**   | GitHub.dev, StackBlitz, Codespaces |
| **Understand the code** | DeepWiki                           |
| **Visualise**           | GitDiagram, Git History            |
| **AI context**          | GitIngest, GitMCP                  |
| **Project insights**    | OSS Insight, Star History          |
| **Supply chain**        | deps.dev, OpenSSF Scorecard        |
| **Search**              | GitHub Code Search                 |

GitDeck doesn't rebuild any of these. It just knows how to point each one at the repo
you're looking at.

## Install

Not in the stores yet. To run it now:

```bash
npm install
npm run dev
```

That opens Chrome with the extension loaded. For Firefox, `npm run dev:firefox`.

## Using it

Click the GitDeck icon on any GitHub repo. Then:

| Key     | Does                         |
| ------- | ---------------------------- |
| `/`     | Jump to the filter box       |
| `↑` `↓` | Move through the deck        |
| `1`–`9` | Open that tool straight away |
| `Enter` | Open the selected tool       |
| `Esc`   | Clear the filter             |

Not on a GitHub page? Paste a repo URL instead.

**Settings** (bottom right of the popup) decides where a tool opens: a new tab, the tab you're
already on, or a background tab so you can fire off several at once.

**Customise** opens a full page where you can star the tools you actually use — starred ones sit
at the top of the deck and keep the low numbers — reorder each section, and hide the rest. All of
it is remembered.

## Privacy

GitDeck asks for two permissions. `activeTab` reads the address of the tab you're on
when you click the icon. `storage` remembers your settings. That's it.

- No tracking, no analytics, no accounts
- No reading your code, your page, or your other tabs
- Nothing is stored except your two preferences — no URLs, no history
- The extension itself never makes a network request — the only thing that happens is
  the link you choose to click

## Want to add a tool?

It's one entry in one file. See **[Adding a tool](docs/adding-a-tool.md)** — it takes
about five minutes.

## More docs

- **[Architecture](docs/architecture.md)** — how it's built and why
- **[Tools](docs/tools.md)** — what's in the deck, how each was verified, what got rejected
- **[Roadmap](docs/roadmap.md)** — what's next
- **[Contributing](CONTRIBUTING.md)** — dev setup and house rules

MIT licensed.
