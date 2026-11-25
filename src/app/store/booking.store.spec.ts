import { TestBed } from '@angular/core/testing';
import { BookingStore } from './booking.store';
import { Room } from '../core/models';

describe('BookingStore', () => {
  let store: InstanceType<typeof BookingStore>;

  const mockRoom: Room = {
    id: 'room-101',
    hotelId: 'hotel-1',
    destinationId: 'dest-1',
    title: 'Azure Lagoon Villa',
    description: 'Private terrace with infinity pool.',
    pricePerNight: 200,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    rating: 4.95,
    reviewCount: 88,
    amenities: ['Wifi', 'Pool', 'Air conditioning'],
    images: ['https://example.com/photo.jpg'],
    propertyType: 'House',
    freeCancellationHours: 48,
    reviews: [],
    bookedRanges: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingStore],
    });
    store = TestBed.inject(BookingStore);
    store.clearDraft();
  });

  it('should initialize with an empty draft', () => {
    expect(store.draft().room).toBeNull();
    expect(store.draft().guests).toBe(1);
    expect(store.hasValidDates()).toBe(false);
  });

  it('should set draft and correctly calculate nights and prices for 2 nights', () => {
    store.setDraft(mockRoom, '2026-12-01', '2026-12-03', 2);

    expect(store.draft().room?.id).toBe('room-101');
    expect(store.draft().guests).toBe(2);
    expect(store.nights()).toBe(2);
    expect(store.hasValidDates()).toBe(true);

    const breakdown = store.priceBreakdown();
    expect(breakdown.nightly).toBe(200);
    expect(breakdown.subtotal).toBe(400); // 200 * 2
    expect(breakdown.discount).toBe(0); // <3 nights => 0% discount
    expect(breakdown.serviceFee).toBe(32); // 8% of 400
    expect(breakdown.total).toBe(432); // 400 - 0 + 32
  });

  it('should apply 15% long-stay discount for bookings >= 3 nights', () => {
    store.setDraft(mockRoom, '2026-12-01', '2026-12-05', 2); // 4 nights

    expect(store.nights()).toBe(4);
    const breakdown = store.priceBreakdown();
    expect(breakdown.subtotal).toBe(800); // 200 * 4
    expect(breakdown.discount).toBe(120); // 15% of 800
    expect(breakdown.serviceFee).toBe(64); // 8% of 800
    expect(breakdown.total).toBe(744); // 800 - 120 + 64
  });

  it('should update dates dynamically', () => {
    store.setDraft(mockRoom, '2026-12-01', '2026-12-02', 1);
    expect(store.nights()).toBe(1);

    store.updateDates('2026-12-01', '2026-12-06');
    expect(store.nights()).toBe(5);
  });
});
