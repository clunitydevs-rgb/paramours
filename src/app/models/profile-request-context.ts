import type { ResponseClient } from './response.interface';

export interface ProfileRequestContext {
  profileLookup?: {
    requestedId: number;
    response: ResponseClient;
  };
}

export function getProfileResponseFromRequestContext(
  context: unknown,
  requestedId: number | null
): ResponseClient | null {
  if (!context || typeof context !== 'object' || requestedId === null) return null;

  const lookup = (context as ProfileRequestContext).profileLookup;
  return lookup?.requestedId === requestedId ? lookup.response : null;
}
