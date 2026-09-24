# Safari

**Status: not planned.** Distributing a Safari extension needs a paid Apple Developer Program
membership, which this project does not justify, so Repohopper ships for Chrome, Edge and Firefox
only. These notes stay for anyone who wants to build it for their own Mac; none of it has been run. The end-to-end suite does load the
popup and options pages in WebKit, Safari's engine, so layout and keyboard handling are covered;
the extension APIs in Safari are not.

Safari runs web extensions wrapped in a native app, made with Apple's converter from the Chrome
build.

## Needs

- A Mac with the full Xcode app from the App Store. The command-line tools alone do not include
  `safari-web-extension-converter`
- For anyone else to install it: membership of the Apple Developer Program, which is paid yearly,
  and App Store review. Local testing needs neither

## Build and run locally

```bash
npm run build
xcrun safari-web-extension-converter .output/chrome-mv3 \
  --app-name Repohopper \
  --bundle-identifier dev.shanedixon.repohopper \
  --macos-only
```

The converter writes an Xcode project and reports any manifest keys Safari does not support. Then:

1. Open the project in Xcode and run the macOS app target
2. In Safari, turn on the developer features (Settings → Advanced), then allow unsigned extensions
   from the Develop menu. This resets each time Safari quits
3. Enable Repohopper in Settings → Extensions, and allow it on github.com when asked

## What to check

The same checklist as the other browsers (CONTRIBUTING), and in particular:

- The popup can read the tab's address after a click. Safari's permission prompts differ from
  Chrome's `activeTab`
- Settings persist between sessions, and whether `storage.sync` actually syncs in Safari
- Copying a clone command works from the popup
- The options page opens in a tab
- The popup's size, and how it scrolls when the deck is long

Record what the converter warned about and anything that differs here, so the next attempt starts
from facts.
