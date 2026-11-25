/// <reference lib="webworker" />

import { Room, PropertyType, BookedDateRange } from '../core/models';

/**
 * ==============================================================================
 * room-filter.worker.ts (Dedicated Web Worker)
 * ==============================================================================
 * Interview Concept:
 * - HTML5 Web Worker executing on a dedicated background OS thread.
 * - Why: Offloads mathematical filtering, date intersection checks, and sorting
 *   for 1,024 rooms across 32 hotels from the main JavaScript browser thread.
 * - Result: Main UI thread remains completely responsive and locked at 60 FPS.
 * - Communication: Triggered via `postMessage()`, returns `FILTER_ROOMS_SUCCESS`.
 * ==============================================================================
 */

export interface FilterCriteria {
  destinationId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  propertyTypes?: PropertyType[];
  priceRanges?: string[]; // 'below50', '50-99', '100-200', 'above200'
  amenities?: string[];
  minRating?: number;
  minBedrooms?: number;
}

export interface WorkerFilterRequest {
  type: 'FILTER_ROOMS';
  payload: {
    rooms: Room[];
    filters: FilterCriteria;
    sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating';
    page: number;
    pageSize: number;
  };
}

export interface WorkerFilterResponse {
  type: 'FILTER_ROOMS_SUCCESS';
  payload: {
    totalCount: number;
    page: number;
    pageSize: number;
    items: Room[];
    timeTakenMs: number;
  };
}

addEventListener('message', ({ data }: MessageEvent<WorkerFilterRequest>) => {
  if (data?.type === 'FILTER_ROOMS') {
    const startTime = performance.now();
    const { rooms, filters, sortBy, page, pageSize } = data.payload;

    let result = rooms.filter((room) => {
      // 1. Destination Filter (ID or Name search)
      if (filters.destinationId) {
        const destQuery = filters.destinationId.toLowerCase();
        const matchesDest =
          room.destinationId.toLowerCase() === destQuery ||
          room.destinationName?.toLowerCase().includes(destQuery) ||
          room.address?.toLowerCase().includes(destQuery);

        if (!matchesDest) return false;
      }

      // 2. Capacity: Must fit guest count
      if (filters.guests && room.maxGuests < filters.guests) {
        return false;
      }

      // 3. Availability Check: No overlapping bookedRanges for selected dates
      if (filters.checkIn && filters.checkOut) {
        const hasOverlap = room.bookedRanges.some((range: BookedDateRange) => {
          return filters.checkIn! <= range.end && filters.checkOut! >= range.start;
        });
        if (hasOverlap) return false;
      }

      // 4. Property Types Check
      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        if (!filters.propertyTypes.includes(room.propertyType)) {
          return false;
        }
      }

      // 5. Price Range Buckets Check
      if (filters.priceRanges && filters.priceRanges.length > 0) {
        const matchesPrice = filters.priceRanges.some((bucket) => {
          if (bucket === 'below50') return room.pricePerNight < 50;
          if (bucket === '50-99') return room.pricePerNight >= 50 && room.pricePerNight <= 99;
          if (bucket === '100-200') return room.pricePerNight >= 100 && room.pricePerNight <= 200;
          if (bucket === 'above200') return room.pricePerNight > 200;
          return true;
        });
        if (!matchesPrice) return false;
      }

      // 6. Amenities Filter (Must have ALL selected amenities)
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((amenity) =>
          room.amenities.includes(amenity)
        );
        if (!hasAll) return false;
      }

      // 7. Rating Filter
      if (filters.minRating && room.rating < filters.minRating) {
        return false;
      }

      // 8. Bedrooms Filter
      if (filters.minBedrooms && room.bedrooms < filters.minBedrooms) {
        return false;
      }

      return true;
    });

    // Sort Results
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price_desc':
        result.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'recommended':
      default:
        result.sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount);
        break;
    }

    const totalCount = result.length;
    const startIndex = (page - 1) * pageSize;
    const items = result.slice(startIndex, startIndex + pageSize);
    const timeTakenMs = Math.round(performance.now() - startTime);

    const response: WorkerFilterResponse = {
      type: 'FILTER_ROOMS_SUCCESS',
      payload: {
        totalCount,
        page,
        pageSize,
        items,
        timeTakenMs,
      },
    };

    postMessage(response);
  }
});
