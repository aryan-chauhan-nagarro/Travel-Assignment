import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class SwUpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly toast = inject(ToastService);

  init(): void {
    this.listenForVersionUpdates();
    this.listenForNetworkStatus();
  }

  private listenForVersionUpdates(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('A new update is available. Reloading for latest features...', 6000);
        setTimeout(() => {
          this.swUpdate?.activateUpdate().then(() => document.location.reload());
        }, 2000);
      });
  }

  private listenForNetworkStatus(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('offline', () => {
      this.toast.warning('You are offline. Showing cached stays and offline data.');
    });

    window.addEventListener('online', () => {
      this.toast.success('Connection restored! You are back online.');
    });
  }
}
