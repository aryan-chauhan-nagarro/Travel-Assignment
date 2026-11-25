import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import confetti from 'canvas-confetti';
import { BookingStore } from '../../store/booking.store';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking } from '../../core/models';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { downloadIcsFile } from '../../core/utils/calendar-generator';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyFormatPipe],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss',
})
export class BookingSuccessComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingStore = inject(BookingStore);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly booking = signal<Booking | null>(null);
  readonly copiedCode = signal<boolean>(false);
  private confettiTimeout?: any;

  ngOnInit(): void {
    this.loadBooking();
    this.launchConfetti();
  }

  ngOnDestroy(): void {
    if (this.confettiTimeout) {
      clearTimeout(this.confettiTimeout);
    }
  }

  private async loadBooking(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('bookingId');
    const storeBooking = this.bookingStore.confirmation();

    if (storeBooking && (!id || storeBooking.id === id)) {
      this.booking.set(storeBooking);
      return;
    }

    if (id) {
      const fetched = await this.bookingService.getBookingById(id);
      if (fetched) {
        this.booking.set(fetched);
      }
    }
  }

  private launchConfetti(): void {
    try {
      // First burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#26D9B0', '#1A2942', '#F59E0B', '#3B82F6'],
      });

      // Follow-up bursts
      this.confettiTimeout = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#26D9B0', '#F59E0B'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#26D9B0', '#3B82F6'],
        });
      }, 350);
    } catch (e) {
      console.warn('Confetti animation failed:', e);
    }
  }

  async copyConfirmationCode(): Promise<void> {
    const code = this.booking()?.confirmationCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      this.copiedCode.set(true);
      this.toast.success(`Code ${code} copied to clipboard!`);
      setTimeout(() => this.copiedCode.set(false), 2500);
    } catch {
      this.toast.info(`Reservation Code: ${code}`);
    }
  }

  downloadCalendar(): void {
    const b = this.booking();
    if (b) {
      downloadIcsFile(b);
      this.toast.success('Calendar event (.ics) downloaded.');
    }
  }
}
