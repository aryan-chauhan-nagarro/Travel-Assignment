import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HotelService } from '../../../core/services/hotel.service';
import { DestinationStore } from '../../../store/destination.store';
import { Hotel } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-hotels',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './admin-hotels.component.html',
  styleUrl: './admin-hotels.component.scss',
})
export class AdminHotelsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly hotelService = inject(HotelService);
  readonly destinationStore = inject(DestinationStore);
  private readonly toast = inject(ToastService);

  readonly hotels = signal<Hotel[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedDestinationFilter = signal<string>('all');
  readonly loading = signal<boolean>(true);

  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);

  readonly deleteModalOpen = signal<boolean>(false);
  readonly selectedHotelToDelete = signal<Hotel | null>(null);

  hotelForm!: FormGroup;

  readonly filteredHotels = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const destFilter = this.selectedDestinationFilter();
    let list = this.hotels();

    if (destFilter !== 'all') {
      list = list.filter((h) => h.destinationId === destFilter);
    }

    if (q) {
      list = list.filter(
        (h) => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadHotels();
    if (this.destinationStore.entities().length === 0) {
      this.destinationStore.loadDestinations();
    }
  }

  private initForm(): void {
    this.hotelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      destinationId: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      image: [
        '',
        [
          Validators.required,
          Validators.pattern(/^https?:\/\/.+/i),
        ],
      ],
      rating: [4.9, [Validators.required, Validators.min(1), Validators.max(5)]],
      checkInTime: ['3:00 PM', Validators.required],
      checkOutTime: ['11:00 AM', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      visible: [true],
    });
  }

  async loadHotels(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.hotelService.getHotels();
      this.hotels.set(list);
    } catch (e) {
      console.error('Error fetching hotels:', e);
    } finally {
      this.loading.set(false);
    }
  }

  getDestinationName(destId: string): string {
    const match = this.destinationStore.entities().find((d) => d.id === destId);
    return match ? match.name : destId;
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  onImgError(event: Event): void {
    const el = event.target as HTMLElement;
    if (el) el.style.display = 'none';
  }

  onFilterDestination(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedDestinationFilter.set(val);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    const defaultDest = this.destinationStore.entities()[0]?.id || '';
    this.hotelForm.reset({
      name: '',
      destinationId: defaultDest,
      address: '',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=70',
      rating: 4.9,
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      description: '',
      visible: true,
    });
    this.isModalOpen.set(true);
  }

  openEditModal(hotel: Hotel): void {
    this.isEditing.set(true);
    this.editingId.set(hotel.id);
    this.hotelForm.patchValue({
      name: hotel.name,
      destinationId: hotel.destinationId,
      address: hotel.address,
      image: hotel.image,
      rating: hotel.rating,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      description: hotel.description,
      visible: hotel.visible,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
  }

  async saveHotel(): Promise<void> {
    if (this.hotelForm.invalid) {
      this.hotelForm.markAllAsTouched();
      return;
    }

    const formValues = this.hotelForm.value;

    try {
      if (this.isEditing() && this.editingId()) {
        const updated = await this.hotelService.updateHotel(this.editingId()!, formValues);
        this.hotels.update((prev) =>
          prev.map((h) => (h.id === updated.id ? updated : h))
        );
        this.toast.success(`Hotel "${updated.name}" updated successfully`);
      } else {
        const created = await this.hotelService.addHotel(formValues);
        this.hotels.update((prev) => [created, ...prev]);
        this.toast.success(`Hotel "${created.name}" created successfully`);
      }
      this.closeModal();
    } catch (e: any) {
      this.toast.error(e.message || 'Operation failed');
    }
  }

  async toggleVisibility(hotel: Hotel): Promise<void> {
    // Optimistic toggle
    this.hotels.update((prev) =>
      prev.map((h) => (h.id === hotel.id ? { ...h, visible: !h.visible } : h))
    );

    try {
      const updated = await this.hotelService.toggleVisibility(hotel.id);
      this.toast.info(`"${updated.name}" is now ${updated.visible ? 'visible' : 'hidden'}`);
    } catch {
      // Rollback
      this.hotels.update((prev) =>
        prev.map((h) => (h.id === hotel.id ? { ...h, visible: hotel.visible } : h))
      );
      this.toast.error('Failed to toggle visibility');
    }
  }

  openDeleteModal(hotel: Hotel): void {
    this.selectedHotelToDelete.set(hotel);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedHotelToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const target = this.selectedHotelToDelete();
    if (target) {
      try {
        await this.hotelService.deleteHotel(target.id);
        this.hotels.update((prev) => prev.filter((h) => h.id !== target.id));
        this.toast.success(`Hotel "${target.name}" deleted.`);
        this.closeDeleteModal();
      } catch (e: any) {
        this.toast.error(e.message || 'Failed to delete hotel');
      }
    }
  }
}
