/**
 * The packaged extension in the real, installed browsers: Google Chrome and
 * Microsoft Edge over the DevTools protocol, Firefox over WebDriver BiDi.
 *
 * Each driver installs the build the way a developer would load it unpacked,
 * opens the extension's own pages in tabs, and records every console error and
 * uncaught exception, so a test can insist on none. No automation can click a
 * browser's toolbar button, so the popup is opened as a page; `activeTab` on a
 * real GitHub tab stays a manual check.
 */
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

export type RealBrowser = 'chrome' | 'edge' | 'firefox';

const EXECUTABLES: Record<RealBrowser, string> = {
  chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
};

const ADDON_ID = 'repohopper@shanedixon.dev';
const FIREFOX_UUID = '0b3f7a1e-5c2d-4e8f-9a6b-1c2d3e4f5a6b';

export interface Tab {
  /** Replaces a text field's value, as typing would. */
  fill(selector: string, text: string): Promise<void>;
  /** A real key press, with the user activation that brings. */
  press(key: 'Enter' | 'ArrowDown' | 'Escape' | '/' | '1' | ' '): Promise<void>;
  /** A real pointer click in the middle of the element. */
  click(selector: string): Promise<void>;
  evaluate<T>(expression: string): Promise<T>;
  close(): Promise<void>;
}

export interface Driver {
  readonly name: RealBrowser;
  /** Opens one of the extension's pages in a new tab. */
  open(file: 'popup.html' | 'options.html'): Promise<Tab>;
  /** The addresses of every open tab. */
  urls(): Promise<string[]>;
  /** Console errors and uncaught exceptions from the extension's own pages. */
  errors(): Promise<string[]>;
  /** Reads the system clipboard where the browser allows it, else null. */
  clipboard(): Promise<string | null>;
  quit(): Promise<void>;
}

export function executable(name: RealBrowser): string {
  return process.env[`${name.toUpperCase()}_PATH`] ?? EXECUTABLES[name];
}

function build(name: RealBrowser): string {
  return resolve(import.meta.dirname, `../../.output/${name}-mv3`);
}

async function until<T>(attempt: () => Promise<T | undefined>, what: string): Promise<T> {
  for (let tries = 0; tries < 150; tries += 1) {
    try {
      const value = await attempt();
      if (value !== undefined) return value;
    } catch {
      /* not ready yet */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

function closedIsFine(page: Page) {
  return (error: unknown) => {
    if (!page.isClosed()) throw error;
  };
}

/** Ends a browser and waits for it to exit, so its profile can be removed. */
function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((done) => {
    child.once('exit', () => done());
    child.kill();
  });
}

function port(): number {
  return 9300 + Math.floor(Math.random() * 600);
}

/** Chrome and Edge: launched with a real profile, the build loaded over CDP. */
async function chromiumFamily(name: 'chrome' | 'edge'): Promise<Driver> {
  const profile = await mkdtemp(join(tmpdir(), `repohopper-${name}-`));
  const debugging = port();
  const child: ChildProcess = spawn(
    executable(name),
    [
      `--remote-debugging-port=${debugging}`,
      '--enable-unsafe-extension-debugging',
      `--user-data-dir=${profile}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const browser: Browser = await until(
    () => chromium.connectOverCDP(`http://127.0.0.1:${debugging}`),
    `${name} to accept a debugger`,
  );
  const session = await browser.newBrowserCDPSession();
  const { id } = (await session.send(
    'Extensions.loadUnpacked' as never,
    {
      path: build(name),
    } as never,
  )) as unknown as { id: string };
  const context = browser.contexts()[0] as BrowserContext;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  const ours = (page: Page) => page.url().startsWith(`chrome-extension://${id}/`);
  const watch = (page: Page) => {
    page.on('pageerror', (error) => {
      if (ours(page)) errors.push(`${page.url()}: ${error.message}`);
    });
    page.on('console', (message) => {
      if (ours(page) && message.type() === 'error') errors.push(`${page.url()}: ${message.text()}`);
    });
  };
  context.pages().forEach(watch);
  context.on('page', watch);

  return {
    name,
    errors: async () => [...errors],
    async open(file) {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${id}/${file}`);
      return {
        fill: (selector, text) => page.locator(selector).fill(text),
        // Opening a tool closes the popup, which is the point, not a failure.
        press: (key) => page.keyboard.press(key).catch(closedIsFine(page)),
        click: (selector) => page.locator(selector).click().catch(closedIsFine(page)),
        evaluate: (expression) => page.evaluate(expression),
        close: () => page.close(),
      };
    },
    async urls() {
      return context.pages().map((page) => page.url());
    },
    async clipboard() {
      const page = context.pages().find((each) => each.url().startsWith('chrome-extension://'));
      return page ? page.evaluate(() => navigator.clipboard.readText()) : null;
    },
    async quit() {
      await browser.close().catch(() => {});
      await stop(child);
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

interface BidiMessage {
  id?: number;
  type?: string;
  method?: string;
  error?: string;
  message?: string;
  result?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

/** KeyboardEvent init for each key a test presses. */
const KEYS: Record<string, { key: string; code: string; keyCode: number }> = {
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  '/': { key: '/', code: 'Slash', keyCode: 191 },
  '1': { key: '1', code: 'Digit1', keyCode: 49 },
  ' ': { key: ' ', code: 'Space', keyCode: 32 },
};

/** Firefox: launched with a fixed extension UUID, the build installed over WebDriver BiDi. */
async function firefox(): Promise<Driver> {
  const profile = await mkdtemp(join(tmpdir(), 'repohopper-firefox-'));
  await writeFile(
    join(profile, 'user.js'),
    [
      `user_pref("extensions.webextensions.uuids", ${JSON.stringify(JSON.stringify({ [ADDON_ID]: FIREFOX_UUID }))});`,
      'user_pref("browser.shell.checkDefaultBrowser", false);',
      '',
    ].join('\n'),
  );
  const debugging = port();
  const child: ChildProcess = spawn(
    executable('firefox'),
    [
      '--headless',
      '--no-remote',
      '--profile',
      profile,
      `--remote-debugging-port=${debugging}`,
      // Lets the driver open the extension's pages, which BiDi's own navigation refuses.
      '--remote-allow-system-access',
    ],
    { stdio: 'ignore' },
  );
  const socket: WebSocket = await until(
    () =>
      new Promise<WebSocket>((done, fail) => {
        const attempt = new WebSocket(`ws://127.0.0.1:${debugging}/session`);
        attempt.onopen = () => done(attempt);
        attempt.onerror = () => fail(new Error('not listening'));
      }),
    'Firefox to accept a WebDriver BiDi session',
  );

  let next = 0;
  const waiting = new Map<number, (message: BidiMessage) => void>();
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data)) as BidiMessage;
    if (message.id !== undefined && waiting.has(message.id)) {
      waiting.get(message.id)?.(message);
      waiting.delete(message.id);
    }
  };
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((done, fail) => {
      next += 1;
      waiting.set(next, (message) =>
        message.type === 'success'
          ? done(message.result ?? {})
          : fail(new Error(`${method}: ${message.error} ${message.message ?? ''}`)),
      );
      socket.send(JSON.stringify({ id: next, method, params }));
    });

  await send('session.new', { capabilities: {} });
  await send('webExtension.install', { extensionData: { type: 'path', path: build('firefox') } });

  type Context = { context: string; url: string; children?: Context[] };
  const contexts = async () =>
    ((await send('browsingContext.getTree', { maxDepth: 0 })).contexts as Context[]).map(
      (each) => ({ context: each.context, url: each.url }),
    );
  const chromeWindow = async () =>
    (
      (await send('browsingContext.getTree', { 'moz:scope': 'chrome', maxDepth: 0 }))
        .contexts as Context[]
    )[0]?.context as string;

  /**
   * A trusted key press in the selected tab, sent from the browser window with the text input
   * processor Firefox's own tests use: BiDi's input actions are refused on extension pages.
   */
  const press = async (key: keyof typeof KEYS) => {
    const init = JSON.stringify(KEYS[key]);
    await send('script.evaluate', {
      expression: `(() => {
        gBrowser.selectedBrowser.focus();
        const input = Cc['@mozilla.org/text-input-processor;1'].createInstance(Ci.nsITextInputProcessor);
        input.beginInputTransactionForTests(window);
        const event = new KeyboardEvent('', ${init});
        input.keydown(event);
        input.keyup(event);
      })()`,
      target: { context: await chromeWindow() },
      awaitPromise: false,
      'moz:scope': 'chrome',
    });
  };

  const evaluate = async <T>(context: string, expression: string): Promise<T> => {
    const result = (await send('script.evaluate', {
      expression,
      target: { context },
      awaitPromise: true,
      serializationOptions: { maxObjectDepth: 3 },
    })) as { type: string; result?: { value?: unknown }; exceptionDetails?: { text: string } };
    if (result.type === 'exception') throw new Error(result.exceptionDetails?.text);
    return deserialise(result.result) as T;
  };

  // BiDi reports nothing from extension pages, so errors are collected from the browser's own
  // console service: uncaught exceptions, CSP violations and failed loads. It is registered before
  // any extension page opens, so errors during loading are caught too. console.error calls stay
  // in the extension's process; each page forwards them once loaded (see open()).
  const origin = `moz-extension://${FIREFOX_UUID}/`;
  await send('script.evaluate', {
    expression: `(() => {
      const origin = ${JSON.stringify(origin)};
      window.repohopperErrors = [];
      Services.console.registerListener({
        observe(message) {
          if (!(message instanceof Ci.nsIScriptError)) return;
          if (message.flags & Ci.nsIScriptError.warningFlag) return;
          if ((message.sourceName || '').startsWith(origin)) {
            window.repohopperErrors.push(message.sourceName + ': ' + message.errorMessage);
          }
        },
      });

    })()`,
    target: { context: await chromeWindow() },
    awaitPromise: false,
    'moz:scope': 'chrome',
  });

  return {
    name: 'firefox',
    async errors() {
      const result = (await send('script.evaluate', {
        expression: 'JSON.stringify(window.repohopperErrors)',
        target: { context: await chromeWindow() },
        awaitPromise: false,
        'moz:scope': 'chrome',
      })) as { result?: { value?: string } };
      return JSON.parse(result.result?.value ?? '[]') as string[];
    },
    async open(file) {
      const url = `moz-extension://${FIREFOX_UUID}/${file}`;
      const before = new Set((await contexts()).map((each) => each.context));
      await send('script.evaluate', {
        expression: `gBrowser.selectedTab = gBrowser.addTab(${JSON.stringify(url)}, { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() }); 'ok'`,
        target: { context: await chromeWindow() },
        awaitPromise: false,
        'moz:scope': 'chrome',
      });
      const context = await until(
        async () =>
          (await contexts()).find((each) => !before.has(each.context) && each.url === url)?.context,
        `${file} to open in Firefox`,
      );
      await until(
        async () =>
          (await evaluate<string>(context, 'document.readyState')) === 'complete'
            ? true
            : undefined,
        `${file} to load`,
      );
      await evaluate(
        context,
        `(() => { const log = console.error; console.error = (...args) => { log(...args); reportError(new Error('console.error: ' + args.map(String).join(' '))); }; })()`,
      );
      return {
        async fill(selector, text) {
          await evaluate(
            context,
            `(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.focus(); field.value = ${JSON.stringify(text)}; field.dispatchEvent(new Event('input', { bubbles: true })); })()`,
          );
        },
        press: (key) => press(key),
        async click(selector) {
          // BiDi refuses simulated pointer input on extension pages, which Firefox treats as
          // privileged. Focusing the element and pressing Space is how a keyboard user clicks,
          // and it carries the user activation that copying needs.
          await evaluate(context, `document.querySelector(${JSON.stringify(selector)}).focus()`);
          await press(' ');
        },
        evaluate: (expression) => evaluate(context, expression),
        async close() {
          await send('browsingContext.close', { context }).catch(() => {});
        },
      };
    },
    async urls() {
      return (await contexts()).map((each) => each.url);
    },
    async clipboard() {
      return null;
    },
    async quit() {
      await send('session.end').catch(() => {});
      socket.close();
      await stop(child);
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

/** Turns a BiDi remote value back into plain data. */
function deserialise(remote: unknown): unknown {
  const value = remote as { type?: string; value?: unknown } | undefined;
  if (value === undefined) return undefined;
  switch (value.type) {
    case 'undefined':
    case 'null':
      return value.type === 'null' ? null : undefined;
    case 'string':
    case 'number':
    case 'boolean':
      return value.value;
    case 'array':
      return (value.value as unknown[]).map(deserialise);
    case 'object':
      return Object.fromEntries(
        (value.value as Array<[string, unknown]>).map(([key, item]) => [key, deserialise(item)]),
      );
    default:
      return value.value;
  }
}

export function launchReal(name: RealBrowser): Promise<Driver> {
  return name === 'firefox' ? firefox() : chromiumFamily(name);
}
