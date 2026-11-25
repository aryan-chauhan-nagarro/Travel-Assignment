export interface SavedSearchFilters {
  propertyTypes: string[];
  priceRanges: string[];
  amenities: string[];
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  destinationId: string;
  destinationName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  filters: SavedSearchFilters;
  createdAt: string;
}
