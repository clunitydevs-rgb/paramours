import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize } from 'rxjs';
import { WEB_VISITS_REGISTER_URL } from '../api/web-visits.config';

export type WebVisitEventType = 'PAGE_VIEW' | 'CLICK_WHATSAPP' | 'CLICK_PHONE';

@Injectable({ providedIn: 'root' })
export class WebVisitService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storageKey = 'paramours.webVisits.paths';
  private readonly inFlight = new Set<string>();
  // Also prevents duplicates if the browser blocks sessionStorage writes.
  private readonly registered = new Set<string>();
  private started = false;

  start(): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => this.register(event.urlAfterRedirects));

    // Covers initialization after the initial navigation has already completed.
    if (this.router.navigated) this.register(this.router.url);
  }

  register(url: string): void {
    this.registerEvent('PAGE_VIEW', url);
  }

  registerEvent(eventType: WebVisitEventType, url: string): void {
    if (!this.isBrowser) return;

    const path = this.normalizePath(url);
    if (!path) return;
    const isPageView = eventType === 'PAGE_VIEW';
    if (isPageView) {
      if (!/^(?:\/|\/escort-[^/]+\/?|\/(?:profile|blog)\/.+)$/.test(path)) return;
      if (this.inFlight.has(path) || this.registered.has(path) || this.readPaths().includes(path)) return;
      this.inFlight.add(path);
    }

    this.http.post(WEB_VISITS_REGISTER_URL, { eventType }, {
      headers: { 'X-Page-Path': path },
      responseType: 'text',
      transferCache: false
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (isPageView) this.inFlight.delete(path);
      })
    ).subscribe({
      next: () => {
        if (!isPageView) return;
        this.registered.add(path);
        try {
          window.sessionStorage.setItem(this.storageKey, JSON.stringify([...new Set([...this.readPaths(), ...this.registered])]));
        } catch {
          // Storage can be unavailable; retain successful visits in memory.
        }
      },
      // Leave failures unregistered so a subsequent navigation can retry.
      error: () => {}
    });
  }

  private normalizePath(url: string): string | null {
    if (/^https?:\/\//i.test(url)) {
      try {
        return new URL(url).pathname;
      } catch {
        return null;
      }
    }
    const path = url.split(/[?#]/, 1)[0];
    return path.startsWith('/') && !path.startsWith('//') ? path : null;
  }

  private readPaths(): string[] {
    try {
      const paths: unknown = JSON.parse(window.sessionStorage.getItem(this.storageKey) ?? '[]');
      return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === 'string') : [];
    } catch {
      return [];
    }
  }
}
