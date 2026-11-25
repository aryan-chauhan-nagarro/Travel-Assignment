import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Room, PriceBreakdown, Booking } from '../core/models';

export interface BookingDraft {
  room: Room | null;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface BookingState {
  draft: BookingDraft;
  confirmation: Booking | null;
}

const initialState: BookingState = {
  draft: {
    room: null,
    checkIn: '',
    checkOut: '',
    guests: 1,
  },
  confirmation: null,
};

export const BookingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ draft }) => {
    const nights = computed(() => {
      const { checkIn, checkOut } = draft();
      if (!checkIn || !checkOut) return 1;
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.abs(d2.getTime() - d1.getTime());
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    });

    const priceBreakdown = computed((): PriceBreakdown => {
      const room = draft().room;
      const n = nights();
      const nightly = room ? room.pricePerNight : 0;
      const subtotal = nightly * n;

      // 15% discount for bookings >= 3 nights or special promo
      const discount = n >= 3 ? Math.round(subtotal * 0.15) : 0;
      // 8% service fee
      const serviceFee = Math.max(12, Math.round(subtotal * 0.08));
      const total = Math.max(0, subtotal - discount + serviceFee);

      return {
        nightly,
        nights: n,
        subtotal,
        discount,
        serviceFee,
        total,
      };
    });

    return {
      nights,
      priceBreakdown,
      hasValidDates: computed(() => Boolean(draft().checkIn && draft().checkOut && draft().checkIn < draft().checkOut)),
    };
  }),

  withMethods((store) => ({
    setDraft(room: Room, checkIn: string, checkOut: string, guests: number): void {
      patchState(store, {
        draft: {
          room,
          checkIn,
          checkOut,
          guests: Math.max(1, guests),
        },
      });
    },

    updateDates(checkIn: string, checkOut: string): void {
      patchState(store, (state) => ({
        draft: {
          ...state.draft,
          checkIn,
          checkOut,
        },
      }));
    },

    updateGuests(guests: number): void {
      patchState(store, (state) => ({
        draft: {
          ...state.draft,
          guests,
        },
      }));
    },

    setConfirmation(booking: Booking | null): void {
      patchState(store, { confirmation: booking });
    },

    clearDraft(): void {
      patchState(store, {
        draft: {
          room: null,
          checkIn: '',
          checkOut: '',
          guests: 1,
        },
      });
    },
  }))
);
