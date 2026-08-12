import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const profile = await readFile('src/app/profile/profile.ts', 'utf8');
const loadProfile = profile.match(/  LoadProfile\(\) \{([\s\S]*?)\n  \}\n\n  private markProfileNotFound/)?.[1] ?? '';

test('profile SSR does not start review-summary API calls', () => {
  for (const method of ['GetCountReviewByUser', 'GetValReviewById']) {
    assert.doesNotMatch(loadProfile, new RegExp(`this\\.api\\.${method}\\(`));
  }
});

test('review summary starts after browser hydration, in parallel, and is deduplicated per profile', () => {
  assert.match(profile, /if \(isPlatformBrowser\(this\.platformId\)\) \{\s*afterNextRender\([\s\S]*?this\.loadInitialReviewSummaryAfterHydration\(\);/);
  assert.match(profile, /!this\.browserHydrated \|\| !this\.isProfileLoaded \|\| !profileId \|\| this\.initialReviewSummaryProfileId === profileId/);
  assert.match(profile, /if \(this\.reviewSummaryLoadingProfileId === profileId\) \{\s*return;/);
  assert.match(profile, /forkJoin\(\{[\s\S]*?count: this\.api\.GetCountReviewByUser\(profileRequest\)[\s\S]*?rating: this\.api\.GetValReviewById\(profileRequest\)/);
  assert.match(profile, /Reviews\(\): void \{\s*this\.loadInitialReviewSummaryAfterHydration\(\);\s*\}/);
});