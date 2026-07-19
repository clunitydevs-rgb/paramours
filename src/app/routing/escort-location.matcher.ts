import { UrlMatcher, UrlSegment } from '@angular/router';

export const escortLocationMatcher: UrlMatcher = (segments) => {
  if (segments.length !== 1) return null;

  const match = /^escorts-([a-z0-9-]+)$/i.exec(segments[0].path);
  if (!match) return null;

  return {
    consumed: segments,
    posParams: { slug: new UrlSegment(match[1].toLowerCase(), {}) }
  };
};
