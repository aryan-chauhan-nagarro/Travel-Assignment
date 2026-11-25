import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DestinationStore } from '../../store/destination.store';
import { Destination } from '../../core/models';
import { DestinationCardComponent } from '../../shared/components/destination-card/destination-card.component';
import { DateRangePickerComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { GuestPickerComponent } from '../../shared/components/guest-picker/guest-picker.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    RouterLink,
    DestinationCardComponent,
    DateRangePickerComponent,
    GuestPickerComponent,
    SkeletonComponent,
    ClickOutsideDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly destinationStore = inject(DestinationStore);
  private readonly router = inject(Router);

  // Hero carousel slides
  readonly heroSlides: HeroSlide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=640&auto=format&fit=crop&q=65',
      title: 'Awaken to a different world',
      subtitle: 'Discover breathtaking landscapes, luxurious stays, and timeless destinations across the globe.',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&auto=format&fit=crop&q=65',
      title: 'Find your peaceful sanctuary',
      subtitle: 'Escape to private island retreats, oceanfront villas, and tranquil mountain sanctuaries.',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=640&auto=format&fit=crop&q=65',
      title: 'Journey beyond the ordinary',
      subtitle: 'Curated boutique stays and bespoke accommodations designed for the conscious explorer.',
    },
  ];

  activeHeroIndex = 0;
  private heroInterval?: any;

  // Search parameters
  selectedDestination = signal<Destination | null>(null);
  destinationSearchQuery = signal<string>('');
  locationDropdownOpen = false;

  checkIn = signal<string>('');
  checkOut = signal<string>('');
  guests = signal<number>(1);

  // 4 Featured destinations for "A Signature of Excellence" (only visible ones)
  readonly featuredDestinations = computed(() => {
    return this.destinationStore.visibleDestinations().slice(0, 4);
  });

  // Autocomplete filtered destinations
  readonly filteredDestinations = computed(() => {
    const q = this.destinationSearchQuery().toLowerCase().trim();
    const list = this.destinationStore.visibleDestinations();
    if (!q) return list;
    return list.filter(
      (d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    );
  });

  readonly selectedDestinationName = computed(() => {
    return this.selectedDestination()?.name || this.destinationSearchQuery();
  });

  ngOnInit(): void {
    // Rotate hero slides every 6 seconds
    this.heroInterval = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroSlides.length;
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

  setHeroIndex(idx: number): void {
    this.activeHeroIndex = idx;
  }

  toggleLocationDropdown(): void {
    this.locationDropdownOpen = !this.locationDropdownOpen;
  }

  onLocationInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.destinationSearchQuery.set(val);
    this.selectedDestination.set(null);
    this.locationDropdownOpen = true;
  }

  selectDestination(dest: Destination): void {
    this.selectedDestination.set(dest);
    this.destinationSearchQuery.set(dest.name);
    this.locationDropdownOpen = false;
  }

  onDatesChange(event: { checkIn: string; checkOut: string }): void {
    this.checkIn.set(event.checkIn);
    this.checkOut.set(event.checkOut);
  }

  onGuestsChange(count: number): void {
    this.guests.set(count);
  }

  onSearch(): void {
    const queryParams: Record<string, string | number> = {};

    const dest = this.selectedDestination();
    if (dest) {
      queryParams['destination'] = dest.id;
    } else if (this.destinationSearchQuery().trim()) {
      queryParams['destination'] = this.destinationSearchQuery().trim();
    }

    if (this.checkIn()) queryParams['checkIn'] = this.checkIn();
    if (this.checkOut()) queryParams['checkOut'] = this.checkOut();
    if (this.guests() >= 1) queryParams['guests'] = this.guests();

    this.router.navigate(['/search'], { queryParams });
  }

  onDestinationClick(dest: Destination): void {
    this.router.navigate(['/search'], { queryParams: { destination: dest.id } });
  }
}
