import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../core/services/room.service';
import { BookingStore } from '../../store/booking.store';
import { ToastService } from '../../core/services/toast.service';
import { Room } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { NightsPipe } from '../../shared/pipes/nights.pipe';
import { DateRangePickerComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { GuestPickerComponent } from '../../shared/components/guest-picker/guest-picker.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    StarRatingComponent,
    CurrencyFormatPipe,
    NightsPipe,
    DateRangePickerComponent,
    GuestPickerComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roomService = inject(RoomService);
  private readonly toast = inject(ToastService);
  readonly bookingStore = inject(BookingStore);

  room = signal<Room | null>(null);
  loading = signal<boolean>(true);

  // Selected reservation details
  selectedCheckIn = signal<string>('');
  selectedCheckOut = signal<string>('');
  selectedGuests = signal<number>(1);

  // Interactive UI flags
  isDescriptionExpanded = false;
  lightboxOpen = false;
  activeLightboxIdx = 0;
  showAmenitiesModal = false;
  isSaved = signal<boolean>(false);

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    const qp = this.route.snapshot.queryParams;

    if (qp['checkIn']) this.selectedCheckIn.set(qp['checkIn']);
    if (qp['checkOut']) this.selectedCheckOut.set(qp['checkOut']);
    if (qp['guests']) this.selectedGuests.set(Number(qp['guests']));

    if (roomId) {
      this.loadRoom(roomId);
    } else {
      this.loading.set(false);
    }
  }

  async loadRoom(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.roomService.getRoomById(id);
      this.room.set(data);

      if (data) {
        // Initialize booking draft in store
        this.bookingStore.setDraft(
          data,
          this.selectedCheckIn(),
          this.selectedCheckOut(),
          this.selectedGuests()
        );
        this.checkIfSaved(data.id);
      }
    } catch {
      this.toast.error('Failed to load room details');
    } finally {
      this.loading.set(false);
    }
  }

  onDatesSelected(event: { checkIn: string; checkOut: string }): void {
    this.selectedCheckIn.set(event.checkIn);
    this.selectedCheckOut.set(event.checkOut);
    this.bookingStore.updateDates(event.checkIn, event.checkOut);
  }

  onGuestsSelected(count: number): void {
    this.selectedGuests.set(count);
    this.bookingStore.updateGuests(count);
  }

  onReserve(): void {
    const currentRoom = this.room();
    if (!currentRoom) return;

    if (!this.selectedCheckIn() || !this.selectedCheckOut()) {
      this.toast.warning('Please select your check-in and check-out dates.');
      return;
    }

    // Persist draft in BookingStore
    this.bookingStore.setDraft(
      currentRoom,
      this.selectedCheckIn(),
      this.selectedCheckOut(),
      this.selectedGuests()
    );

    // Navigate to checkout with query params for deep-linking & refresh resiliency
    this.router.navigate(['/checkout', currentRoom.id], {
      queryParams: {
        checkIn: this.selectedCheckIn(),
        checkOut: this.selectedCheckOut(),
        guests: this.selectedGuests(),
      },
    });
  }

  openLightbox(index: number): void {
    this.activeLightboxIdx = index;
    this.lightboxOpen = true;
  }

  prevLightboxImage(): void {
    const total = this.room()?.images.length || 1;
    this.activeLightboxIdx = (this.activeLightboxIdx - 1 + total) % total;
  }

  nextLightboxImage(): void {
    const total = this.room()?.images.length || 1;
    this.activeLightboxIdx = (this.activeLightboxIdx + 1) % total;
  }

  onShare(): void {
    navigator.clipboard?.writeText(window.location.href);
    this.toast.info('Link copied to clipboard!');
  }

  toggleSave(): void {
    const r = this.room();
    if (!r) return;

    const saved = !this.isSaved();
    this.isSaved.set(saved);

    try {
      const raw = localStorage.getItem('travel_favorite_rooms');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (saved) {
        if (!list.includes(r.id)) list.push(r.id);
        this.toast.success(`Saved "${r.title}" to favorites!`);
      } else {
        const idx = list.indexOf(r.id);
        if (idx > -1) list.splice(idx, 1);
        this.toast.info(`Removed "${r.title}" from saved stays`);
      }
      localStorage.setItem('travel_favorite_rooms', JSON.stringify(list));
    } catch {}
  }

  private checkIfSaved(id: string): void {
    try {
      const raw = localStorage.getItem('travel_favorite_rooms');
      if (raw) {
        const list: string[] = JSON.parse(raw);
        this.isSaved.set(list.includes(id));
      }
    } catch {}
  }

  goBackToSearch(): void {
    this.router.navigate(['/search']);
  }
}
