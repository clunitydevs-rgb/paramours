import { readFile } from 'node:fs/promises';
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  const asset = url.match(/\/assets\/data\/([a-z]+\.json)(?:\?.*)?$/);
  if (asset) return new Response(await readFile(new URL(`../../public/assets/data/${asset[1]}`, import.meta.url)),
    { headers: { 'content-type': 'application/json' } });
  if (/^https:\/\/cl\.api\./.test(url)) {
    return originalFetch(`${process.env.PHASE1_FIXTURE_ORIGIN}/api?url=${encodeURIComponent(url)}`, {
      ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), 'x-fixture-side': 'ssr' }
    });
  }
  return originalFetch(input, init);
};
