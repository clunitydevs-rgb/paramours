import { routes } from './app.routes';

describe('Home routes', () => {
  it('keeps the root path as the real Home route', () => {
    const rootRoute = routes.find(route => route.path === '');

    expect(rootRoute).toBeDefined();
    expect(rootRoute?.loadComponent).toBeDefined();
    expect(rootRoute?.pathMatch).toBe('full');
    expect(rootRoute?.redirectTo).toBeUndefined();
  });

  it('redirects the legacy /home path to the root path', () => {
    const legacyHomeRoute = routes.find(route => route.path === 'home');

    expect(legacyHomeRoute).toEqual(jasmine.objectContaining({
      path: 'home',
      redirectTo: '',
      pathMatch: 'full'
    }));
    expect(legacyHomeRoute?.loadComponent).toBeUndefined();
  });
});