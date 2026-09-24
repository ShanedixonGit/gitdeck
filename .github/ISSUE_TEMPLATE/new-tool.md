---
name: New tool
about: Suggest a tool for the Repohopper registry
labels: tool
---

Before suggesting, check [the rejected list](../../docs/tools.md#rejected): each entry there has a
dated reason. The registry carries one tool per job, so a tool that does what an existing one does
needs a reason to replace it.

**Tool name and website:**

**What it does for the user**, in a few words (it becomes the card's title, such as "Diagram the
architecture"):

**URL transformation** (how a GitHub repository is passed to it):

```
https://example.com/{owner}/{repo}
```

**Verification.** Paste the result of requesting the transformed URL for a known repository, and
say what on the page shows it is about that repository:

```
curl -sIL -A "Mozilla/5.0" "https://example.com/facebook/react"
```

**Section:** Open in an editor / Get the code / Understand the code / Visualise / AI context /
Project insights / Security & dependencies / Search

**Does it require an account?** Tools behind a sign-in wall are generally not accepted.
