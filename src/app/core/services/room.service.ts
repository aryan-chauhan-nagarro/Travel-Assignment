import { Injectable, inject } from '@angular/core';
import { Room } from '../models';
import { SeedService } from './seed.service';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private readonly seedService = inject(SeedService);

  async getAllRooms(): Promise<Room[]> {
    const data = await this.seedService.seedIfEmpty();
    return data.rooms;
  }

  async getRoomById(id: string): Promise<Room | null> {
    const rooms = await this.getAllRooms();
    return rooms.find((r) => r.id === id) || null;
  }

  async getRoomsByDestination(destinationId: string): Promise<Room[]> {
    const rooms = await this.getAllRooms();
    return rooms.filter((r) => r.destinationId === destinationId);
  }
}
