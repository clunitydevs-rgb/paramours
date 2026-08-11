import { PublicClientsCache } from './public-clients-cache';

describe('PublicClientsCache', () => {
  let now: number;
  let cache: PublicClientsCache<string>;

  beforeEach(() => {
    now = 0;
    cache = new PublicClientsCache<string>(60_000, () => now);
  });

  it('caches the first public response for 60 seconds', async () => {
    let calls = 0;
    const load = async () => {
      calls++;
      return `catalog-${calls}`;
    };

    expect(await cache.get(load)).toBe('catalog-1');
    expect(await cache.get(load)).toBe('catalog-1');
    expect(calls).toBe(1);
  });

  it('refreshes after the TTL expires', async () => {
    let calls = 0;
    const load = async () => `catalog-${++calls}`;

    await cache.get(load);
    now = 60_001;

    expect(await cache.get(load)).toBe('catalog-2');
    expect(calls).toBe(2);
  });

  it('shares one in-flight request across concurrent consumers such as Home and sitemap', async () => {
    let calls = 0;
    let resolveLoad!: (value: string) => void;
    const load = () => {
      calls++;
      return new Promise<string>(resolve => resolveLoad = resolve);
    };

    const requests = Array.from({ length: 10 }, () => cache.get(load));
    await Promise.resolve();
    expect(calls).toBe(1);

    resolveLoad('catalog');
    await expectAsync(Promise.all(requests)).toBeResolvedTo(Array(10).fill('catalog'));
  });

  it('does not cache failures and allows the next request to retry', async () => {
    let calls = 0;
    const fail = async () => {
      calls++;
      throw new Error('GetClients unavailable');
    };

    await expectAsync(cache.get(fail)).toBeRejectedWithError('GetClients unavailable');
    await expectAsync(cache.get(fail)).toBeRejectedWithError('GetClients unavailable');
    expect(calls).toBe(2);
  });
});