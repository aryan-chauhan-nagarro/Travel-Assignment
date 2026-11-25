import { Injectable } from '@angular/core';
import { Booking } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly STORAGE_KEY = 'travel_cached_bookings';

  async createBooking(bookingData: Omit<Booking, 'id' | 'confirmationCode' | 'createdAt' | 'status'>): Promise<Booking> {
    const confirmationCode = this.generateConfirmationCode();
    const newBooking: Booking = {
      ...bookingData,
      id: 'booking-' + Math.random().toString(36).substring(2, 9),
      confirmationCode,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const bookings = this.getBookingsFromStorage();
    bookings.unshift(newBooking);
    this.saveBookingsToStorage(bookings);

    return newBooking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    const bookings = this.getBookingsFromStorage();
    return bookings.filter((b) => b.userId === userId);
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const bookings = this.getBookingsFromStorage();
    return bookings.find((b) => b.id === id) || null;
  }

  async cancelBooking(id: string): Promise<Booking> {
    const bookings = this.getBookingsFromStorage();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error('Booking not found');
    }
    bookings[index].status = 'cancelled';
    this.saveBookingsToStorage(bookings);
    return bookings[index];
  }

  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private getBookingsFromStorage(): Booking[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? (JSON.parse(data) as Booking[]) : [];
    } catch {
      return [];
    }
  }

  private saveBookingsToStorage(list: Booking[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Booking storage save failed:', e);
    }
  }
}
