import { Injectable, inject } from '@angular/core';
import { Destination } from '../models';
import { SeedService } from './seed.service';

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  private readonly seedService = inject(SeedService);
  private readonly STORAGE_KEY = 'travel_cached_destinations';

  async getDestinations(): Promise<Destination[]> {
    const data = await this.seedService.seedIfEmpty();
    return data.destinations;
  }

  async getDestinationById(id: string): Promise<Destination | null> {
    const list = await this.getDestinations();
    return list.find((d) => d.id === id) || null;
  }

  async addDestination(item: Omit<Destination, 'id' | 'createdAt'>): Promise<Destination> {
    const list = await this.getDestinations();
    const newDest: Destination = {
      ...item,
      id: 'dest-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newDest);
    this.saveList(list);
    return newDest;
  }

  async updateDestination(id: string, updates: Partial<Destination>): Promise<Destination> {
    const list = await this.getDestinations();
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Destination not found');
    }
    list[index] = { ...list[index], ...updates };
    this.saveList(list);
    return list[index];
  }

  async deleteDestination(id: string): Promise<void> {
    let list = await this.getDestinations();
    list = list.filter((d) => d.id !== id);
    this.saveList(list);
  }

  async toggleVisibility(id: string): Promise<Destination> {
    const list = await this.getDestinations();
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error('Destination not found');
    }
    list[index].visible = !list[index].visible;
    this.saveList(list);
    return list[index];
  }

  private saveList(list: Destination[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}
