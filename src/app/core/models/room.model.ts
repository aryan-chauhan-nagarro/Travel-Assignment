export type PropertyType = 'Hotel' | 'Guesthouse' | 'House' | 'Apartment';

export interface RoomReview {
  author: string;
  avatar?: string;
  date: string;
  rating: number;
  text: string;
}

export interface BookedDateRange {
  start: string; // ISO date string YYYY-MM-DD
  end: string;   // ISO date string YYYY-MM-DD
}

export interface Room {
  id: string;
  hotelId: string;
  destinationId: string;
  title: string;
  propertyType: PropertyType;
  images: string[];
  maxGuests: number;
  beds: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  amenities: string[];
  rating: number;
  reviewCount: number;
  freeCancellationHours: number;
  description: string;
  reviews: RoomReview[];
  bookedRanges: BookedDateRange[];
  // Derived/joined fields for convenience
  hotelName?: string;
  destinationName?: string;
  address?: string;
}
