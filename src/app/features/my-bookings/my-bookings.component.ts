import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking } from '../../core/models';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { downloadIcsFile } from '../../core/utils/calendar-generator';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe, ConfirmDialogComponent],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss',
})
export class MyBookingsComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly bookings = signal<Booking[]>([]);
  readonly activeTab = signal<'upcoming' | 'all' | 'cancelled'>('upcoming');
  readonly loading = signal<boolean>(true);

  // Cancellation modal state
  selectedBookingToCancel = signal<Booking | null>(null);
  confirmModalOpen = signal<boolean>(false);

  readonly filteredBookings = computed(() => {
    const tab = this.activeTab();
    const list = this.bookings();
    const now = new Date().toISOString().split('T')[0];

    if (tab === 'upcoming') {
      return list.filter((b) => b.status === 'confirmed' && b.checkOut >= now);
    }
    if (tab === 'cancelled') {
      return list.filter((b) => b.status === 'cancelled');
    }
    return list;
  });

  ngOnInit(): void {
    this.loadUserBookings();
  }

  async loadUserBookings(): Promise<void> {
    this.loading.set(true);
    try {
      const user = this.authStore.user();
      const userId = user?.uid || 'guest-user';
      let list = await this.bookingService.getUserBookings(userId);

      // If user has no specific bookings under uid, also check for any local test bookings
      if (list.length === 0 && userId !== 'guest-user') {
        const fallback = await this.bookingService.getUserBookings('guest-user');
        list = [...list, ...fallback];
      }

      this.bookings.set(list);
    } catch (e) {
      console.error('Error fetching bookings:', e);
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: 'upcoming' | 'all' | 'cancelled'): void {
    this.activeTab.set(tab);
  }

  downloadCalendar(b: Booking): void {
    downloadIcsFile(b);
    this.toast.success('Calendar event (.ics) downloaded.');
  }

  async copyCode(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.toast.success(`Copied code: ${code}`);
    } catch {
      this.toast.info(`Code: ${code}`);
    }
  }

  openCancelModal(b: Booking): void {
    this.selectedBookingToCancel.set(b);
    this.confirmModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.confirmModalOpen.set(false);
    this.selectedBookingToCancel.set(null);
  }

  async confirmCancellation(): Promise<void> {
    const target = this.selectedBookingToCancel();
    if (!target) return;

    try {
      await this.bookingService.cancelBooking(target.id);
      this.toast.success(`Reservation ${target.confirmationCode} has been cancelled.`);

      // Optimistically update list
      this.bookings.update((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, status: 'cancelled' } : b))
      );
      this.closeCancelModal();
    } catch (e: any) {
      this.toast.error(e.message || 'Failed to cancel reservation.');
    }
  }
}
