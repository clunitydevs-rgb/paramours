import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

    private readonly measurementId = 'G-BT2BN7FP87';
    private platformId = inject(PLATFORM_ID);

    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    private get gtag(): Function | null {
        if (!this.isBrowser) return null;
        return (window as any).gtag ?? null;
    }

    trackPage(url: string): void {
        const gtag = this.gtag;
        if (!gtag) return;

        gtag('config', this.measurementId, {
            page_path: url,
            page_title: document.title
        });
    }

    trackEvent(name: string, params: Record<string, any> = {}): void {
        const gtag = this.gtag;
        if (!gtag) return;

        gtag('event', name, params);
    }
}