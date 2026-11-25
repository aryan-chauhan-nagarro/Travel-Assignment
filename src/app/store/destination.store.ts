import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { Destination } from '../core/models';
import { DestinationService } from '../core/services/destination.service';
import { ToastService } from '../core/services/toast.service';

export interface DestinationState {
  entities: Destination[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: DestinationState = {
  entities: [],
  selectedId: null,
  loading: false,
  error: null,
};

export const DestinationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ entities, selectedId }) => ({
    visibleDestinations: computed(() => entities().filter((d) => d.visible)),
    selectedDestination: computed(() => entities().find((d) => d.id === selectedId()) || null),
    totalCount: computed(() => entities().length),
  })),

  withMethods((store, destinationService = inject(DestinationService), toast = inject(ToastService)) => ({
    async loadDestinations(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const list = await destinationService.getDestinations();
        patchState(store, { entities: list, loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load destinations';
        patchState(store, { loading: false, error: msg });
        toast.error(msg);
      }
    },

    selectDestination(id: string | null): void {
      patchState(store, { selectedId: id });
    },

    async addDestination(item: Omit<Destination, 'id' | 'createdAt'>): Promise<void> {
      patchState(store, { loading: true });
      try {
        const created = await destinationService.addDestination(item);
        patchState(store, (state) => ({
          entities: [created, ...state.entities],
          loading: false,
        }));
        toast.success(`Destination "${created.name}" created successfully!`);
      } catch (err) {
        patchState(store, { loading: false });
        toast.error('Failed to add destination');
      }
    },

    async updateDestination(id: string, updates: Partial<Destination>): Promise<void> {
      // Optimistic update
      const previous = [...store.entities()];
      patchState(store, (state) => ({
        entities: state.entities.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      }));

      try {
        await destinationService.updateDestination(id, updates);
        toast.success('Destination updated successfully');
      } catch (err) {
        // Rollback
        patchState(store, { entities: previous });
        toast.error('Failed to update destination, rolled back');
      }
    },

    async toggleVisibility(id: string): Promise<void> {
      // Optimistic toggle
      const previous = [...store.entities()];
      patchState(store, (state) => ({
        entities: state.entities.map((d) => (d.id === id ? { ...d, visible: !d.visible } : d)),
      }));

      try {
        const updated = await destinationService.toggleVisibility(id);
        toast.info(`"${updated.name}" is now ${updated.visible ? 'visible' : 'hidden'} on home page`);
      } catch (err) {
        // Rollback
        patchState(store, { entities: previous });
        toast.error('Failed to update visibility, rolled back');
      }
    },

    async deleteDestination(id: string): Promise<void> {
      const previous = [...store.entities()];
      patchState(store, (state) => ({
        entities: state.entities.filter((d) => d.id !== id),
      }));

      try {
        await destinationService.deleteDestination(id);
        toast.success('Destination deleted successfully');
      } catch (err) {
        // Rollback
        patchState(store, { entities: previous });
        toast.error('Failed to delete destination');
      }
    },
  })),

  withHooks({
    onInit(store) {
      store.loadDestinations();
    },
  })
);
