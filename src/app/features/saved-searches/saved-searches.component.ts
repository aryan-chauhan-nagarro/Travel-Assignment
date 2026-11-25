import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { SavedSearchService } from '../../core/services/saved-search.service';
import { DestinationStore } from '../../store/destination.store';
import { ToastService } from '../../core/services/toast.service';
import { SavedSearch } from '../../core/models';

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './saved-searches.component.html',
  styleUrl: './saved-searches.component.scss',
})
export class SavedSearchesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly savedSearchService = inject(SavedSearchService);
  readonly destinationStore = inject(DestinationStore);
  private readonly toast = inject(ToastService);

  readonly savedSearches = signal<SavedSearch[]>([]);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadSavedSearches();
    if (this.destinationStore.entities().length === 0) {
      this.destinationStore.loadDestinations();
    }
  }

  async loadSavedSearches(): Promise<void> {
    this.loading.set(true);
    try {
      const user = this.authStore.user();
      const userId = user?.uid || 'guest';
      const list = await this.savedSearchService.getUserSavedSearches(userId);
      this.savedSearches.set(list);
    } catch (e) {
      console.error('Error loading saved searches:', e);
    } finally {
      this.loading.set(false);
    }
  }

  getDestinationLabel(destId?: string): string {
    if (!destId) return 'Any Destination';
    const match = this.destinationStore.entities().find((d) => d.id === destId);
    return match ? `${match.name}, ${match.country}` : destId;
  }

  isDatesExpired(checkIn?: string): boolean {
    if (!checkIn) return false;
    const now = new Date().toISOString().split('T')[0];
    return checkIn < now;
  }

  runSearch(item: SavedSearch): void {
    const queryParams: Record<string, any> = {};

    if (item.destinationId && item.destinationId !== 'Anywhere') {
      queryParams['destination'] = item.destinationId;
    }

    // If dates are expired, adjust or omit them so user doesn't get 0 results
    if (item.checkIn && !this.isDatesExpired(item.checkIn)) {
      queryParams['checkIn'] = item.checkIn;
      if (item.checkOut) queryParams['checkOut'] = item.checkOut;
    }

    if (item.guests) {
      queryParams['guests'] = item.guests;
    }

    if (item.filters?.propertyTypes?.length) {
      queryParams['type'] = item.filters.propertyTypes.join(',');
    }

    this.toast.info(`Running search: "${item.name}"`);
    this.router.navigate(['/search'], { queryParams });
  }

  async deleteSearch(id: string): Promise<void> {
    try {
      await this.savedSearchService.deleteSavedSearch(id);
      this.savedSearches.update((prev) => prev.filter((s) => s.id !== id));
      this.toast.success('Saved search removed.');
    } catch (e: any) {
      this.toast.error(e.message || 'Failed to remove search.');
    }
  }
}
