import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

/** Keeps navigation and HTTP work from hiding each other's loading indicator. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = new Set<symbol>();
  private readonly navigations = new Map<number, () => void>();

  constructor(
    private readonly spinner: NgxSpinnerService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  begin(): () => void {
    if (!isPlatformBrowser(this.platformId)) return () => {};

    const token = Symbol('loading');
    const wasIdle = this.pending.size === 0;
    this.pending.add(token);
    if (wasIdle) void this.spinner.show();

    return () => {
      if (this.pending.delete(token) && this.pending.size === 0) {
        void this.spinner.hide();
      }
    };
  }

  startNavigation(id: number): void {
    if (!this.navigations.has(id)) this.navigations.set(id, this.begin());
  }

  endNavigation(id: number): void {
    this.navigations.get(id)?.();
    this.navigations.delete(id);
  }
}
