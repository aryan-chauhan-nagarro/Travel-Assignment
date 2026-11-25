import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthStore } from '../../core/auth/auth.store';
import { BookingStore } from '../../store/booking.store';
import { RoomService } from '../../core/services/room.service';
import { HotelService } from '../../core/services/hotel.service';
import { PaymentService } from '../../core/services/payment.service';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { Room, Hotel } from '../../core/models';
import {
  luhnValidator,
  expiryValidator,
  formatCardNumber,
  formatExpiry,
  detectCardBrand,
} from '../../core/utils/card-validator';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { NightsPipe } from '../../shared/pipes/nights.pipe';
import { DateRangePickerComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { GuestPickerComponent } from '../../shared/components/guest-picker/guest-picker.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyFormatPipe,
    NightsPipe,
    DateRangePickerComponent,
    GuestPickerComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly bookingStore = inject(BookingStore);
  private readonly roomService = inject(RoomService);
  private readonly hotelService = inject(HotelService);
  private readonly paymentService = inject(PaymentService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly isProcessing = signal<boolean>(false);
  readonly paymentError = signal<string | null>(null);
  readonly cardBrand = signal<'visa' | 'mastercard' | 'amex' | 'generic'>('generic');
  readonly currentHotel = signal<Hotel | null>(null);
  readonly currentRoom = signal<Room | null>(null);

  // Edit trip toggles
  editingDates = signal<boolean>(false);
  editingGuests = signal<boolean>(false);

  checkoutForm!: FormGroup;

  readonly priceBreakdown = computed(() => this.bookingStore.priceBreakdown());
  readonly nights = computed(() => this.bookingStore.nights());
  readonly draft = computed(() => this.bookingStore.draft());

  ngOnInit(): void {
    this.initForm();
    this.loadBookingContext();
  }

  private initForm(): void {
    const user = this.authStore.user();
    this.checkoutForm = this.fb.group({
      fullName: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,20}$/)]],
      cardNumber: ['', [Validators.required, luhnValidator()]],
      cardHolder: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      expiry: ['', [Validators.required, expiryValidator()]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      saveCard: [true],
    });
  }

  private async loadBookingContext(): Promise<void> {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    const qp = this.route.snapshot.queryParams;

    let room = this.bookingStore.draft().room;

    // If page is refreshed or visited directly without existing draft in memory
    if ((!room || room.id !== roomId) && roomId) {
      const fetchedRoom = await this.roomService.getRoomById(roomId);
      if (fetchedRoom) {
        room = fetchedRoom;
        const checkIn = qp['checkIn'] || this.getDefaultCheckIn();
        const checkOut = qp['checkOut'] || this.getDefaultCheckOut();
        const guests = qp['guests'] ? Number(qp['guests']) : 1;
        this.bookingStore.setDraft(room, checkIn, checkOut, guests);
      } else {
        this.toast.error('Selected room could not be found.');
        this.router.navigate(['/search']);
        return;
      }
    }

    if (room) {
      this.currentRoom.set(room);
      const hotel = await this.hotelService.getHotelById(room.hotelId);
      if (hotel) {
        this.currentHotel.set(hotel);
      }
    }
  }

  // Format Card Number (XXXX XXXX XXXX XXXX) & detect brand
  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCardNumber(input.value);
    this.checkoutForm.get('cardNumber')?.setValue(formatted, { emitEvent: false });
    this.cardBrand.set(detectCardBrand(formatted));
  }

  // Format Expiry (MM/YY)
  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatExpiry(input.value);
    this.checkoutForm.get('expiry')?.setValue(formatted, { emitEvent: false });
  }

  // Format CVV
  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.checkoutForm.get('cvv')?.setValue(digits, { emitEvent: false });
  }

  onBack(): void {
    if (typeof window !== 'undefined') {
      window.history.back();
    } else {
      this.router.navigate(['/search']);
    }
  }

  // Auto-fill valid demo card for evaluators
  fillDemoCard(): void {
    this.checkoutForm.patchValue({
      cardNumber: '4242 4242 4242 4242',
      cardHolder: this.authStore.userName() || 'Alex Morgan',
      expiry: '12/28',
      cvv: '123',
    });
    this.cardBrand.set('visa');
    this.toast.info('Demo Visa card populated.');
  }

  // Inline dates update
  onDatesUpdated(event: { checkIn: string; checkOut: string }): void {
    this.bookingStore.updateDates(event.checkIn, event.checkOut);
    this.editingDates.set(false);
  }

  // Inline guests update
  onGuestsUpdated(count: number): void {
    this.bookingStore.updateGuests(count);
    this.editingGuests.set(false);
  }

  async onPayNow(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.toast.warning('Please complete all required fields correctly.');
      return;
    }

    const room = this.currentRoom() || this.bookingStore.draft().room;
    const hotel = this.currentHotel();
    const draft = this.bookingStore.draft();
    const price = this.priceBreakdown();

    if (!room || !draft.checkIn || !draft.checkOut) {
      this.toast.error('Booking details are incomplete.');
      return;
    }

    this.isProcessing.set(true);
    this.paymentError.set(null);

    const formValues = this.checkoutForm.value;

    this.paymentService
      .pay({
        amount: price.total,
        method: 'credit_card',
        cardDetails: {
          cardNumber: formValues.cardNumber,
          cardHolder: formValues.cardHolder,
          expiry: formValues.expiry,
          cvv: formValues.cvv,
        },
      })
      .subscribe({
        next: async (res) => {
          try {
            const userId = this.authStore.user()?.uid || 'guest-user';

            const newBooking = await this.bookingService.createBooking({
              userId,
              roomId: room.id,
              hotelId: room.hotelId,
              destinationId: room.destinationId,
              checkIn: draft.checkIn,
              checkOut: draft.checkOut,
              guests: draft.guests,
              nights: this.nights(),
              priceBreakdown: price,
              paymentMethod: 'credit_card',
              roomTitle: room.title,
              hotelName: hotel?.name || 'Exclusive Resort',
              destinationName: hotel?.address || 'Scenic Retreat',
              roomImage: room.images[0] || '',
              address: hotel?.address || 'Beachfront Avenue',
              checkInTime: hotel?.checkInTime || '3:00 PM',
              checkOutTime: hotel?.checkOutTime || '11:00 AM',
            });

            this.bookingStore.setConfirmation(newBooking);
            this.toast.success('Payment authorized! Reservation confirmed.');
            this.isProcessing.set(false);
            this.router.navigate(['/booking-success', newBooking.id]);
          } catch (e: any) {
            this.isProcessing.set(false);
            this.paymentError.set(e.message || 'Failed to save booking. Please contact support.');
          }
        },
        error: (err) => {
          this.isProcessing.set(false);
          const errorMsg = err.message || 'Payment was declined. Please try again or use another card.';
          this.paymentError.set(errorMsg);
          this.toast.error(errorMsg);
        },
      });
  }

  private getDefaultCheckIn(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  private getDefaultCheckOut(): string {
    const d = new Date();
    d.setDate(d.getDate() + 11);
    return d.toISOString().split('T')[0];
  }
}
