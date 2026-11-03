import { readFile } from 'node:fs/promises';
const originalFetch = globalThis.fetch;
const profiles = [
  { iD_USUARIO: 10, nombrE_USUARIO: 'Ana', slug: 'ana', ciudad: 0, comuna: 1, estado: 'V' },
  { iD_USUARIO: 11, nombrE_USUARIO: 'Bea', slug: 'bea', ciudad: 0, comuna: 0, estado: 'V' },
  { iD_USUARIO: 12, nombrE_USUARIO: 'Cata', slug: 'cata', ciudad: 3, comuna: 1, estado: 'V' }
];
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  if (url.includes('/Client/GetClients')) return Response.json({ oClient: profiles, ncoderror: 0 });
  if (url.includes('/GetBlogs')) return Response.json({ oBlog: [], ncoderror: 0 });
  const asset = url.match(/\/assets\/data\/([a-z]+\.json)(?:\?.*)?$/);
  if (asset) return new Response(await readFile(new URL(`../../public/assets/data/${asset[1]}`, import.meta.url)), { headers: { 'Content-Type': 'application/json' } });
  if (/^https?:\/\//.test(url) && !url.includes('127.0.0.1')) throw new Error(`Unexpected external request: ${url}`);
  return originalFetch(input, init);
};
