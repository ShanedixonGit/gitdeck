# Adding a tool

Adding a tool to GitDeck is one object in one array. If you find yourself editing anything in
`components/` or writing a conditional on a tool `id`, the registry is missing an abstraction —
open an issue instead.

## 1. Verify it first

Before writing any code, confirm the tool is actually usable:

```bash
curl -sIL -A "Mozilla/5.0" "https://thetool.dev/facebook/react"
```

It must be publicly reachable, respond successfully, and show a page about the repository you
asked for — not a landing page, a sign-in wall or an error. If it needs an account, or the
repository can only be passed by pasting into a form, it does not qualify.

## 2. Add the entry

In [`src/lib/tools/registry.ts`](../src/lib/tools/registry.ts):

```ts
{
  id: 'the-tool',
  name: 'Do the useful thing',
  brand: 'The Tool',
  description: 'Do the useful thing with the repository.',
  category: 'understand',
  urlTemplate: 'https://thetool.dev/{owner}/{repo}',
  website: 'https://thetool.dev',
  docsUrl: 'https://github.com/someone/the-tool',
  status: 'verified',
  verifiedAt: '2026-09-20',
  icon: 'tt',
}
```

Rules the tests enforce:

- `id` is kebab-case, stable and never reused.
- `name` says what the tool does for the user, led by a verb, and is never just `brand`. The card
  leads with the job; the brand sits underneath as provenance.
- `description` is one imperative sentence ending in a full stop, describing what the _user_
  gets — not what the service is.
- `urlTemplate` and `website` are HTTPS.
- `verifiedAt` is the ISO date you ran the check above.
- A non-`verified` status must have `notes` explaining why.

## 3. Template syntax

Placeholders: `{owner}`, `{repo}`, `{ref}`, `{path}`. Everything else is literal.

| Need                            | Template                                               |
| ------------------------------- | ------------------------------------------------------ |
| Plain path                      | `https://x.dev/{owner}/{repo}`                         |
| Encoded separator               | `https://deps.dev/project/github/{owner}%2F{repo}`     |
| Query parameter                 | `https://x.dev/viewer/?uri=github.com/{owner}/{repo}`  |
| Fragment                        | `https://www.star-history.com/#{owner}/{repo}`         |
| File path, separators preserved | `https://x.dev/{owner}/{repo}/blob/{ref}/{path\|path}` |

Values are percent-encoded by default. `{name|path}` encodes each segment but keeps the `/`;
`{name|raw}` inserts the value untouched.

## 4. File-scoped tools

If the template uses `{ref}` or `{path}`, declare them:

```ts
urlTemplate: 'https://x.dev/{owner}/{repo}/blob/{ref}/{path|path}',
requires: ['ref', 'path'],
```

The tool is then offered only when the user is viewing a file, and skipped with an explanation
otherwise. The registry test fails if `requires` and the template disagree in either direction.

## 5. Choose a category

Categories are declared in [`src/lib/tools/categories.ts`](../src/lib/tools/categories.ts), which
also sets the order sections appear in the deck. Adding a category means adding one entry there
and one member to the `ToolCategory` union — nothing else.

## 6. Check it

```bash
npm run check
```

This types, lints, format-checks and runs the tests, including the registry invariants and a
resolution of your entry against a full repository reference.

## 7. Document it

Add a row to the relevant table in [docs/tools.md](tools.md) with how you verified it. If you
evaluated a tool and rejected it, add it to the rejected table instead — a dated reason saves the
next person the same investigation.
