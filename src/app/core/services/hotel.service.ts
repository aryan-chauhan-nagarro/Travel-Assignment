import { Injectable, inject } from '@angular/core';
import { Hotel } from '../models';
import { SeedService } from './seed.service';

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  private readonly seedService = inject(SeedService);
  private readonly STORAGE_KEY = 'travel_cached_hotels';

  async getHotels(): Promise<Hotel[]> {
    const data = await this.seedService.seedIfEmpty();
    return data.hotels;
  }

  async getHotelsByDestination(destinationId: string): Promise<Hotel[]> {
    const list = await this.getHotels();
    return list.filter((h) => h.destinationId === destinationId);
  }

  async getHotelById(id: string): Promise<Hotel | null> {
    const list = await this.getHotels();
    return list.find((h) => h.id === id) || null;
  }

  async addHotel(item: Omit<Hotel, 'id'>): Promise<Hotel> {
    const list = await this.getHotels();
    const newHotel: Hotel = {
      ...item,
      id: 'hotel-' + Math.random().toString(36).substring(2, 9),
    };
    list.unshift(newHotel);
    this.saveList(list);
    return newHotel;
  }

  async updateHotel(id: string, updates: Partial<Hotel>): Promise<Hotel> {
    const list = await this.getHotels();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error('Hotel not found');
    }
    list[index] = { ...list[index], ...updates };
    this.saveList(list);
    return list[index];
  }

  async deleteHotel(id: string): Promise<void> {
    let list = await this.getHotels();
    list = list.filter((h) => h.id !== id);
    this.saveList(list);
  }

  async toggleVisibility(id: string): Promise<Hotel> {
    const list = await this.getHotels();
    const index = list.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error('Hotel not found');
    }
    list[index].visible = !list[index].visible;
    this.saveList(list);
    return list[index];
  }

  private saveList(list: Hotel[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}
