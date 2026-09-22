/**
 * Checks every link GitDeck shows is still alive: each tool's destination for a
 * real repository, plus the website and docs links on the options page. A
 * `copy` tool has no destination, only text, so only its links are checked.
 *
 * This runs in CI and on demand — never in the extension. GitDeck makes no
 * network requests of its own precisely so that opening the popup does not
 * announce the repository you are viewing to a dozen third parties; doing
 * availability checks at runtime would give that away for the sake of a
 * greyed-out card. Instead the check happens here, against a fixed public
 * repository, and the result is a report a human acts on by editing the
 * registry's `status` field.
 *
 * Usage: node --experimental-strip-types scripts/check-links.ts [--json]
 * Exit code 1 if any verified tool failed, so CI can fail on it.
 */
import { TOOLS } from '../src/lib/tools/registry.ts';
import { renderTemplate } from '../src/lib/tools/template.ts';

/** A large, stable, public repository that every tool should be able to handle. */
const PROBE = { owner: 'facebook', repo: 'react', ref: 'main', path: 'README.md' };

const TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

interface Result {
  id: string;
  brand: string;
  /** Which of the tool's links this is. */
  link: 'destination' | 'website' | 'docs';
  status: string;
  url: string;
  ok: boolean;
  detail: string;
}

async function probe(url: string): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
      signal: controller.signal,
    });
    await response.body?.cancel();
    // 401/403/429 mean the service is up but guarded — a human decides whether
    // that is a dead tool or a bot wall, so it is reported, not judged here.
    return { ok: response.ok, detail: `HTTP ${response.status}` };
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    return { ok: false, detail: reason === 'AbortError' ? 'timed out' : reason };
  } finally {
    clearTimeout(timer);
  }
}

const links = TOOLS.flatMap((tool) => {
  const each: Array<{ tool: (typeof TOOLS)[number]; link: Result['link']; url: string }> = [
    { tool, link: 'website', url: tool.website },
  ];
  if (tool.action !== 'copy') {
    each.unshift({ tool, link: 'destination', url: renderTemplate(tool.urlTemplate, PROBE) });
  }
  if (tool.docsUrl !== undefined) each.push({ tool, link: 'docs', url: tool.docsUrl });
  return each;
});

const results: Result[] = await Promise.all(
  links.map(async ({ tool, link, url }) => ({
    id: tool.id,
    brand: tool.brand,
    link,
    status: tool.status,
    url,
    ...(await probe(url)),
  })),
);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const result of results) {
    const mark = result.ok ? 'ok  ' : 'FAIL';
    const label = `${result.brand} (${result.link})`;
    console.log(`${mark} ${label.padEnd(36)} ${result.detail.padEnd(12)} ${result.url}`);
  }
}

const broken = results.filter((result) => !result.ok && result.status === 'verified');
if (broken.length > 0) {
  console.error(
    `\n${broken.length} link(s) on verified tools failed. Re-check by hand, then set status to ` +
      `"unverified" or "deprecated" in src/lib/tools/registry.ts — the popup only ever shows ` +
      `what the registry claims is good.`,
  );
  process.exit(1);
}
console.log(`\nAll ${results.length} links on ${TOOLS.length} tools reachable.`);
