import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomStore } from '../../store/room.store';
import { DestinationStore } from '../../store/destination.store';
import { AuthStore } from '../../core/auth/auth.store';
import { SavedSearchService } from '../../core/services/saved-search.service';
import { ToastService } from '../../core/services/toast.service';
import { Room, PropertyType } from '../../core/models';
import { RoomCardComponent } from '../../shared/components/room-card/room-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RoomCardComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  readonly roomStore = inject(RoomStore);
  readonly destinationStore = inject(DestinationStore);
  readonly authStore = inject(AuthStore);
  private readonly savedSearchService = inject(SavedSearchService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Available filter options
  readonly propertyTypeOptions: PropertyType[] = ['Hotel', 'Guesthouse', 'House', 'Apartment'];
  readonly priceBuckets = [
    { id: 'below50', label: 'Below ₹50' },
    { id: '50-99', label: '₹50 to ₹99' },
    { id: '100-200', label: '₹100 to ₹200' },
    { id: 'above200', label: 'Above ₹200' },
  ];
  readonly popularAmenities = [
    'Wifi', 'Kitchen', 'Air conditioning', 'Washer',
    'Free parking', 'Pool', 'Hot tub', 'Gym', 'Balcony'
  ];

  // Collapsible sidebar sections
  sectionsOpen = {
    propertyType: true,
    price: true,
    reviews: true,
    amenities: false,
    roomsBeds: false,
  };

  mobileFiltersOpen = false;
  editSearchModalOpen = false;
  saveSearchModalOpen = false;
  saveSearchName = '';

  // Quick edit search state
  selectedDestinationId = '';
  selectedCheckIn = '';
  selectedCheckOut = '';
  selectedGuests = 1;

  modalAdults = signal(1);
  modalChildren = signal(0);

  // Min date for date pickers (today)
  readonly todayString = new Date().toISOString().split('T')[0];

  readonly quickDestinations = [
    { label: 'Anywhere', value: '' },
    { label: 'Tokyo', value: 'Tokyo' },
    { label: 'Paris', value: 'Paris' },
    { label: 'Bali', value: 'Bali' },
    { label: 'New York', value: 'New York' },
    { label: 'London', value: 'London' },
    { label: 'Rome', value: 'Rome' },
  ];

  // Selected filter criteria
  selectedPropertyTypes = signal<PropertyType[]>([]);
  selectedPriceRanges = signal<string[]>([]);
  selectedAmenities = signal<string[]>([]);
  selectedMinRating?: number;
  selectedMinBedrooms?: number;

  // Saved favorites set
  favorites = signal<Set<string>>(new Set());

  // Labels for the top summary pill
  readonly currentDestinationLabel = computed(() => {
    const destId = this.roomStore.filters().destinationId;
    if (!destId) return 'Anywhere';
    const match = this.destinationStore.entities().find((d) => d.id === destId);
    return match ? `${match.name}, ${match.country}` : destId;
  });

  readonly currentDatesLabel = computed(() => {
    const checkIn = this.roomStore.filters().checkIn;
    const checkOut = this.roomStore.filters().checkOut;
    if (checkIn && checkOut) {
      return `${this.formatShortDate(checkIn)} – ${this.formatShortDate(checkOut)}`;
    }
    return 'Any dates';
  });

  readonly currentGuestsLabel = computed(() => {
    const count = this.roomStore.filters().guests || 1;
    return count === 1 ? '1 guest' : `${count} guests`;
  });

  readonly calculatedNights = computed(() => {
    const checkIn = this.roomStore.filters().checkIn;
    const checkOut = this.roomStore.filters().checkOut;
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    return 1;
  });

  ngOnInit(): void {
    this.loadFavoritesFromStorage();

    // Listen to query parameters to sync store with URL
    this.route.queryParams.subscribe((params) => {
      const dest = params['destination'] || undefined;
      const inDate = params['checkIn'] || undefined;
      const outDate = params['checkOut'] || undefined;
      const guests = params['guests'] ? Number(params['guests']) : 1;
      const pTypes = params['type'] ? (params['type'].split(',') as PropertyType[]) : [];
      const page = params['page'] ? Number(params['page']) : 1;

      this.selectedDestinationId = dest || '';
      this.selectedCheckIn = inDate || '';
      this.selectedCheckOut = outDate || '';
      this.selectedGuests = guests;
      this.selectedPropertyTypes.set(pTypes);

      this.roomStore.setFilters({
        destinationId: dest,
        checkIn: inDate,
        checkOut: outDate,
        guests,
        propertyTypes: pTypes,
        priceRanges: this.selectedPriceRanges(),
        amenities: this.selectedAmenities(),
        minRating: this.selectedMinRating,
        minBedrooms: this.selectedMinBedrooms,
      });

      this.roomStore.setPage(page);
    });
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  toggleSection(section: keyof typeof this.sectionsOpen): void {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  // Property Type Filter Handlers
  isPropertyTypeSelected(type: PropertyType): boolean {
    return this.selectedPropertyTypes().includes(type);
  }

  togglePropertyType(type: PropertyType): void {
    const current = [...this.selectedPropertyTypes()];
    const index = current.indexOf(type);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(type);
    }
    this.selectedPropertyTypes.set(current);
    this.updateSearchCriteria({ propertyTypes: current });
  }

  // Price Filter Handlers
  isPriceBucketSelected(bucketId: string): boolean {
    return this.selectedPriceRanges().includes(bucketId);
  }

  isPriceRangeSelected(bucketId: string): boolean {
    return this.isPriceBucketSelected(bucketId);
  }

  togglePriceBucket(bucketId: string): void {
    const current = [...this.selectedPriceRanges()];
    const index = current.indexOf(bucketId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(bucketId);
    }
    this.selectedPriceRanges.set(current);
    this.updateSearchCriteria({ priceRanges: current });
  }

  togglePriceRange(bucketId: string): void {
    this.togglePriceBucket(bucketId);
  }

  // Rating Filter Handlers
  setMinRating(rating?: number): void {
    this.selectedMinRating = rating;
    this.updateSearchCriteria({ minRating: rating });
  }

  // Amenity Filter Handlers
  isAmenitySelected(amenity: string): boolean {
    return this.selectedAmenities().includes(amenity);
  }

  toggleAmenity(amenity: string): void {
    const current = [...this.selectedAmenities()];
    const index = current.indexOf(amenity);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(amenity);
    }
    this.selectedAmenities.set(current);
    this.updateSearchCriteria({ amenities: current });
  }

  // Bedrooms Filter Handlers
  setMinBedrooms(count?: number): void {
    this.selectedMinBedrooms = count;
    this.updateSearchCriteria({ minBedrooms: count });
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as any;
    this.roomStore.setSort(val);
  }

  onPageChange(page: number): void {
    this.roomStore.setPage(page);
    this.syncUrlParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onResetFilters(): void {
    this.selectedPropertyTypes.set([]);
    this.selectedPriceRanges.set([]);
    this.selectedAmenities.set([]);
    this.selectedMinRating = undefined;
    this.selectedMinBedrooms = undefined;
    this.roomStore.resetFilters();
    this.router.navigate(['/search']);
  }

  onRoomSelect(room: Room): void {
    const queryParams: Record<string, string | number> = {};
    if (this.roomStore.filters().checkIn) queryParams['checkIn'] = this.roomStore.filters().checkIn!;
    if (this.roomStore.filters().checkOut) queryParams['checkOut'] = this.roomStore.filters().checkOut!;
    if (this.roomStore.filters().guests) queryParams['guests'] = this.roomStore.filters().guests!;

    this.router.navigate(['/rooms', room.id], { queryParams });
  }

  // Favorites
  isFavorite(roomId: string): boolean {
    return this.favorites().has(roomId);
  }

  onFavoriteToggle(room: Room): void {
    const set = new Set(this.favorites());
    if (set.has(room.id)) {
      set.delete(room.id);
      this.toast.info(`Removed "${room.title}" from saved stays`);
    } else {
      set.add(room.id);
      this.toast.success(`Saved "${room.title}" to favorites!`);
    }
    this.favorites.set(set);
    this.saveFavoritesToStorage();
  }

  // Quick Edit Modal Handlers (Fixes modal scroll & overlapping popups)
  openEditSearchModal(): void {
    const filters = this.roomStore.filters();
    this.selectedDestinationId = filters.destinationId || '';
    this.selectedCheckIn = filters.checkIn || '';
    this.selectedCheckOut = filters.checkOut || '';
    const totalGuests = filters.guests || 1;
    this.modalAdults.set(Math.max(1, totalGuests));
    this.modalChildren.set(0);
    this.selectedGuests = totalGuests;

    this.editSearchModalOpen = true;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeEditSearchModal(): void {
    this.editSearchModalOpen = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  selectQuickDestination(dest: string): void {
    this.selectedDestinationId = dest;
  }

  incrementAdults(): void {
    if (this.modalAdults() < 16) {
      this.modalAdults.update((n) => n + 1);
      this.syncModalGuests();
    }
  }

  decrementAdults(): void {
    if (this.modalAdults() > 1) {
      this.modalAdults.update((n) => n - 1);
      this.syncModalGuests();
    }
  }

  incrementChildren(): void {
    if (this.modalChildren() < 10) {
      this.modalChildren.update((n) => n + 1);
      this.syncModalGuests();
    }
  }

  decrementChildren(): void {
    if (this.modalChildren() > 0) {
      this.modalChildren.update((n) => n - 1);
      this.syncModalGuests();
    }
  }

  private syncModalGuests(): void {
    this.selectedGuests = this.modalAdults() + this.modalChildren();
  }

  setPresetDates(type: 'weekend' | 'week' | 'twoweeks' | 'clear'): void {
    if (type === 'clear') {
      this.selectedCheckIn = '';
      this.selectedCheckOut = '';
      return;
    }

    const today = new Date();
    if (type === 'weekend') {
      const day = today.getDay();
      const diffToFriday = (5 - day + 7) % 7 || 7;
      const friday = new Date(today);
      friday.setDate(today.getDate() + diffToFriday);
      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      this.selectedCheckIn = friday.toISOString().split('T')[0];
      this.selectedCheckOut = sunday.toISOString().split('T')[0];
    } else if (type === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      this.selectedCheckIn = start.toISOString().split('T')[0];
      this.selectedCheckOut = end.toISOString().split('T')[0];
    } else if (type === 'twoweeks') {
      const start = new Date(today);
      start.setDate(today.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 14);
      this.selectedCheckIn = start.toISOString().split('T')[0];
      this.selectedCheckOut = end.toISOString().split('T')[0];
    }
  }

  applyQuickEditSearch(): void {
    this.closeEditSearchModal();
    this.syncUrlParams({
      destination: this.selectedDestinationId || null,
      checkIn: this.selectedCheckIn || null,
      checkOut: this.selectedCheckOut || null,
      guests: this.selectedGuests,
      page: 1,
    });
  }

  // Bonus: Save Search
  openSaveSearchModal(): void {
    const dest = this.currentDestinationLabel();
    this.saveSearchName = `${dest} (${this.currentDatesLabel()})`;
    this.saveSearchModalOpen = true;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeSaveSearchModal(): void {
    this.saveSearchModalOpen = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  async confirmSaveSearch(): Promise<void> {
    const userId = this.authStore.user()?.uid || 'guest';
    const filters = this.roomStore.filters();

    await this.savedSearchService.saveSearch({
      userId,
      name: this.saveSearchName || 'My Saved Search',
      destinationId: filters.destinationId || 'Anywhere',
      destinationName: this.currentDestinationLabel(),
      checkIn: filters.checkIn || '',
      checkOut: filters.checkOut || '',
      guests: filters.guests || 1,
      filters: {
        propertyTypes: (filters.propertyTypes || []) as string[],
        priceRanges: filters.priceRanges || [],
        amenities: filters.amenities || [],
      },
    });

    this.closeSaveSearchModal();
    this.toast.success(`Search "${this.saveSearchName}" saved for future reference!`);
  }

  private updateSearchCriteria(partial: any): void {
    this.roomStore.setFilters(partial);
    // Sync property types to URL
    if (partial.propertyTypes) {
      this.syncUrlParams({
        type: partial.propertyTypes.length ? partial.propertyTypes.join(',') : null,
        page: 1,
      });
    }
  }

  private syncUrlParams(params: Record<string, any>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  private formatShortDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  }

  private loadFavoritesFromStorage(): void {
    try {
      const data = localStorage.getItem('travel_favorite_rooms');
      if (data) {
        this.favorites.set(new Set(JSON.parse(data)));
      }
    } catch {}
  }

  private saveFavoritesToStorage(): void {
    try {
      localStorage.setItem('travel_favorite_rooms', JSON.stringify(Array.from(this.favorites())));
    } catch {}
  }
}
