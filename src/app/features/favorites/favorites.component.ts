import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Room } from '../../core/models';
import { RoomService } from '../../core/services/room.service';
import { ToastService } from '../../core/services/toast.service';
import { RoomCardComponent } from '../../shared/components/room-card/room-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

/**
 * ==============================================================================
 * FavoritesComponent
 * ==============================================================================
 * Interview Concept:
 * - Standalone Component managing user wishlist / saved stays.
 * - Reads persisted room IDs from localStorage key `travel_favorite_rooms`.
 * - Cross-references with RoomService to display rich room cards.
 * - Emits real-time removal with toast notifications.
 * - Displays empty state fallback when no favorites exist.
 * ==============================================================================
 */
@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RoomCardComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly favoriteRooms = signal<Room[]>([]);
  private readonly STORAGE_KEY = 'travel_favorite_rooms';

  async ngOnInit(): Promise<void> {
    await this.loadFavorites();
  }

  async loadFavorites(): Promise<void> {
    this.loading.set(true);
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const favoriteIds: string[] = raw ? JSON.parse(raw) : [];

      if (favoriteIds.length === 0) {
        this.favoriteRooms.set([]);
        this.loading.set(false);
        return;
      }

      const allRooms = await this.roomService.getAllRooms();
      const matched = allRooms.filter((r) => favoriteIds.includes(r.id));
      this.favoriteRooms.set(matched);
    } catch {
      this.favoriteRooms.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onRoomSelect(room: Room): void {
    this.router.navigate(['/rooms', room.id]);
  }

  onFavoriteToggle(room: Room): void {
    const current = this.favoriteRooms().filter((r) => r.id !== room.id);
    this.favoriteRooms.set(current);

    const updatedIds = current.map((r) => r.id);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedIds));
    } catch {}

    this.toast.info(`Removed "${room.title}" from saved stays`);
  }

  clearAllFavorites(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
    this.favoriteRooms.set([]);
    this.toast.info('All saved favorites cleared');
  }

  navigateToSearch(): void {
    this.router.navigate(['/search']);
  }
}
