import type { ResponseClient } from './app/models/response.interface';

export const PUBLIC_CLIENTS_URL = 'https://cl.api.client.paramours.cl/api/v1/Client/GetClients';
export const PUBLIC_CLIENTS_CACHE_TTL_MS = 60_000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class PublicClientsCache<T> {
  private entry: CacheEntry<T> | null = null;
  private inFlight: Promise<T> | null = null;

  constructor(
    private readonly ttlMs = PUBLIC_CLIENTS_CACHE_TTL_MS,
    private readonly now = () => Date.now()
  ) {}

  get(load: () => Promise<T>): Promise<T> {
    if (this.entry && this.entry.expiresAt > this.now()) {
      return Promise.resolve(this.entry.value);
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = Promise.resolve()
      .then(load)
      .then(value => {
        this.entry = { value, expiresAt: this.now() + this.ttlMs };
        return value;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }
}

type PublicClientsCacheGlobal = typeof globalThis & {
  __paramoursPublicClientsCache?: PublicClientsCache<ResponseClient>;
};

const cacheGlobal = globalThis as PublicClientsCacheGlobal;

export const publicClientsCache = cacheGlobal.__paramoursPublicClientsCache
  ?? (cacheGlobal.__paramoursPublicClientsCache = new PublicClientsCache<ResponseClient>());