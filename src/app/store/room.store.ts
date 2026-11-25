import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { Room } from '../core/models';
import { RoomService } from '../core/services/room.service';
import { FilterCriteria, WorkerFilterRequest, WorkerFilterResponse } from '../workers/room-filter.worker';

export interface RoomState {
  allRooms: Room[];
  filters: FilterCriteria;
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating';
  page: number;
  pageSize: number;
  pageItems: Room[];
  totalCount: number;
  loading: boolean;
  workerTimeMs: number;
}

const initialFilters: FilterCriteria = {
  destinationId: undefined,
  checkIn: undefined,
  checkOut: undefined,
  guests: 1,
  propertyTypes: [],
  priceRanges: [],
  amenities: [],
  minRating: undefined,
  minBedrooms: undefined,
};

const initialState: RoomState = {
  allRooms: [],
  filters: initialFilters,
  sortBy: 'recommended',
  page: 1,
  pageSize: 10,
  pageItems: [],
  totalCount: 0,
  loading: false,
  workerTimeMs: 0,
};

export const RoomStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ totalCount, page, pageSize, workerTimeMs }) => ({
    totalPages: computed(() => Math.max(1, Math.ceil(totalCount() / pageSize()))),
    performanceLabel: computed(() =>
      workerTimeMs() > 0 ? `Filtered in ${workerTimeMs()}ms via Web Worker` : 'Filtered via Web Worker'
    ),
  })),

  withMethods((store, roomService = inject(RoomService)) => {
    let worker: Worker | null = null;

    const initWorker = () => {
      if (typeof Worker !== 'undefined' && !worker) {
        try {
          worker = new Worker(new URL('../workers/room-filter.worker', import.meta.url), {
            type: 'module',
          });

          worker.onmessage = ({ data }: MessageEvent<WorkerFilterResponse>) => {
            if (data?.type === 'FILTER_ROOMS_SUCCESS') {
              patchState(store, {
                totalCount: data.payload.totalCount,
                pageItems: data.payload.items,
                loading: false,
                workerTimeMs: data.payload.timeTakenMs,
              });
            }
          };
        } catch (e) {
          console.warn('Web Worker initialization fallback to main thread:', e);
          worker = null;
        }
      }
    };

    const triggerFilter = () => {
      patchState(store, { loading: true });
      initWorker();

      const payload = {
        rooms: store.allRooms(),
        filters: store.filters(),
        sortBy: store.sortBy(),
        page: store.page(),
        pageSize: store.pageSize(),
      };

      if (worker) {
        const req: WorkerFilterRequest = {
          type: 'FILTER_ROOMS',
          payload,
        };
        worker.postMessage(req);
      } else {
        // Fallback filtering on main thread if Worker is not supported
        fallbackFilter(payload);
      }
    };

    const fallbackFilter = (payload: any) => {
      const startTime = performance.now();
      const { rooms, filters, sortBy, page, pageSize } = payload;

      let result = rooms.filter((room: Room) => {
        if (filters.destinationId) {
          const q = filters.destinationId.toLowerCase();
          const match =
            room.destinationId.toLowerCase() === q ||
            room.destinationName?.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filters.guests && room.maxGuests < filters.guests) return false;
        if (filters.propertyTypes?.length && !filters.propertyTypes.includes(room.propertyType)) return false;
        return true;
      });

      const totalCount = result.length;
      const startIndex = (page - 1) * pageSize;
      const items = result.slice(startIndex, startIndex + pageSize);

      patchState(store, {
        totalCount,
        pageItems: items,
        loading: false,
        workerTimeMs: Math.round(performance.now() - startTime),
      });
    };

    return {
      async loadAllRooms(): Promise<void> {
        if (store.allRooms().length > 0) {
          triggerFilter();
          return;
        }

        patchState(store, { loading: true });
        const rooms = await roomService.getAllRooms();
        patchState(store, { allRooms: rooms });
        triggerFilter();
      },

      setFilters(partialFilters: Partial<FilterCriteria>): void {
        patchState(store, (state) => ({
          filters: { ...state.filters, ...partialFilters },
          page: 1, // Reset to first page on filter change
        }));
        triggerFilter();
      },

      setSort(sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating'): void {
        patchState(store, { sortBy, page: 1 });
        triggerFilter();
      },

      setPage(page: number): void {
        patchState(store, { page });
        triggerFilter();
      },

      resetFilters(): void {
        patchState(store, { filters: initialFilters, page: 1, sortBy: 'recommended' });
        triggerFilter();
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAllRooms();
    },
  })
);
