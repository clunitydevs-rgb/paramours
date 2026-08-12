import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const profile = await readFile('src/app/profile/profile.ts', 'utf8');
const loadProfile = profile.match(/  LoadProfile\(\) \{([\s\S]*?)\n  \}\n\n  private markProfileNotFound/)?.[1] ?? '';

test('profile SSR does not load non-critical reference catalogs', () => {
  for (const method of ['getNaciones', 'getGeneros', 'getColorOjos', 'getColorCabello', 'getBiotipo']) {
    assert.doesNotMatch(loadProfile, new RegExp(`this\\.api\\.${method}\\(`));
  }

  for (const method of ['getCiudades', 'getComunas', 'getMetros']) {
    assert.match(loadProfile, new RegExp(`this\\.api\\.${method}\\(`));
  }
});

test('reference catalogs load once after hydration and resolve labels together', () => {
  assert.match(profile, /if \(isPlatformBrowser\(this\.platformId\)\) \{\s*afterNextRender\(/);
  assert.match(profile, /this\.loadReferenceCatalogsAfterHydration\(\);/);
  assert.match(profile, /referenceCatalogsLoading \|\| this\.referenceCatalogsLoaded/);
  assert.match(profile, /forkJoin\(\{[\s\S]*getNaciones\(\)[\s\S]*getGeneros\(\)[\s\S]*getColorOjos\(\)[\s\S]*getColorCabello\(\)[\s\S]*getBiotipo\(\)/);
  assert.match(profile, /this\.resolveReferenceDetails\(\);\s*this\.referenceCatalogsLoaded = true/);
});