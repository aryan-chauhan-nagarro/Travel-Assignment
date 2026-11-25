export interface Hotel {
  id: string;
  destinationId: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  visible: boolean;
  checkInTime: string; // e.g. "after 2PM"
  checkOutTime: string; // e.g. "11AM"
  description: string;
}
