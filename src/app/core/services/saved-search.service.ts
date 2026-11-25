import { Injectable } from '@angular/core';
import { SavedSearch } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SavedSearchService {
  private readonly STORAGE_KEY = 'travel_cached_saved_searches';

  async saveSearch(data: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> {
    const newSearch: SavedSearch = {
      ...data,
      id: 'search-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };

    const searches = this.getSearchesFromStorage();
    searches.unshift(newSearch);
    this.saveSearchesToStorage(searches);

    return newSearch;
  }

  async getUserSavedSearches(userId: string): Promise<SavedSearch[]> {
    const searches = this.getSearchesFromStorage();
    return searches.filter((s) => s.userId === userId || s.userId === 'guest');
  }

  async deleteSavedSearch(id: string): Promise<void> {
    let searches = this.getSearchesFromStorage();
    searches = searches.filter((s) => s.id !== id);
    this.saveSearchesToStorage(searches);
  }

  private getSearchesFromStorage(): SavedSearch[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? (JSON.parse(data) as SavedSearch[]) : [];
    } catch {
      return [];
    }
  }

  private saveSearchesToStorage(list: SavedSearch[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Saved search storage save failed:', e);
    }
  }
}
