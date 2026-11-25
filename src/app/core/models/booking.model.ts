export interface PriceBreakdown {
  nightly: number;
  nights: number;
  subtotal: number;
  discount: number;
  serviceFee: number;
  total: number;
}

export type PaymentMethod = 'credit_card' | 'paypal' | 'google_pay';
export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  confirmationCode: string; // 8-char uppercase alphanumeric
  userId: string;
  roomId: string;
  hotelId: string;
  destinationId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  nights: number;
  priceBreakdown: PriceBreakdown;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  // Denormalized details for offline & fast rendering
  roomTitle?: string;
  hotelName?: string;
  destinationName?: string;
  roomImage?: string;
  checkInTime?: string;
  checkOutTime?: string;
  address?: string;
}
