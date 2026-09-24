# Privacy policy

_Effective 2026-09-23. Applies to the Repohopper browser extension for Chrome, Edge and Firefox._

Repohopper collects no personal data. It has no servers, no accounts, no analytics and no tracking.
It sends nothing to its developer or to anyone else.

## What Repohopper reads

When you click the Repohopper icon, the browser lets it read the address of the tab you are on
(the `activeTab` permission). Repohopper uses that address only to work out which GitHub repository,
branch and file you are looking at, so it can build links for the tools in your deck. It holds
the address in memory while the popup is open and discards it when the popup closes.

Repohopper does not read the content of any page, your code, your GitHub account, your browsing
history or any other tab.

## What Repohopper stores

Your settings, and nothing else:

- the tools in your deck, and their order
- where tools open: a new tab, the current tab or a background tab
- whether to offer tools that could not be verified automatically

They are kept in your browser's extension sync storage (the `storage` permission). If you have
turned on your browser's sync, the browser copies these settings between your devices through
your browser account with Google, Microsoft or Mozilla, under that company's privacy policy.
Repohopper never sees that copy. No repository names, addresses or history are stored.

Removing the extension removes its settings from the browser. If sync is on, your browser's sync
service handles any copy it holds under its own rules.

## What Repohopper sends

Nothing. The extension makes no network requests of its own. Section icons are drawn from data
bundled with the extension, so opening the popup contacts no one.

## Third-party tools

Repohopper is a connector. When you choose a tool, your browser opens that service's website, and
the link includes the repository (and, for some tools, the branch and file) you were viewing.
That service then receives the request like any other visit, and its own privacy policy and terms
apply. Repohopper is not affiliated with any of these services and has no control over what they
collect.

If you are viewing a private repository, opening a third-party tool sends that repository's name
to the service. Most of them cannot open private repositories anyway.

Copy tools, such as the clone commands, put text on your clipboard and contact no one.

## Changes

Changes to this policy are recorded in this file's history on GitHub, and in the changelog of the
release that makes them.

## Contact

Questions go to the project's issue tracker: https://github.com/ShanedixonGit/repohopper/issues
