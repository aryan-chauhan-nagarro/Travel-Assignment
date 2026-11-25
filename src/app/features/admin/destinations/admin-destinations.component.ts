import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DestinationStore } from '../../../store/destination.store';
import { Destination } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './admin-destinations.component.html',
  styleUrl: './admin-destinations.component.scss',
})
export class AdminDestinationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly destinationStore = inject(DestinationStore);

  readonly searchQuery = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingId = signal<string | null>(null);

  // Delete confirm modal state
  readonly deleteModalOpen = signal<boolean>(false);
  readonly selectedDestinationToDelete = signal<Destination | null>(null);

  destinationForm!: FormGroup;

  readonly filteredDestinations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.destinationStore.entities();
    if (!q) return list;
    return list.filter(
      (d) => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.initForm();
    if (this.destinationStore.entities().length === 0) {
      this.destinationStore.loadDestinations();
    }
  }

  private initForm(): void {
    this.destinationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      country: ['', [Validators.required, Validators.minLength(2)]],
      image: [
        '',
        [
          Validators.required,
          Validators.pattern(/^https?:\/\/.+/i),
        ],
      ],
      description: ['', [Validators.required, Validators.minLength(10)]],
      propertyCount: [128, [Validators.required, Validators.min(1)]],
      visible: [true],
    });
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  onImgError(event: Event): void {
    const el = event.target as HTMLElement;
    if (el) el.style.display = 'none';
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.destinationForm.reset({
      name: '',
      country: '',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=70',
      description: '',
      propertyCount: 128,
      visible: true,
    });
    this.isModalOpen.set(true);
  }

  openEditModal(dest: Destination): void {
    this.isEditing.set(true);
    this.editingId.set(dest.id);
    this.destinationForm.patchValue({
      name: dest.name,
      country: dest.country,
      image: dest.image,
      description: dest.description,
      propertyCount: dest.propertyCount,
      visible: dest.visible,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
  }

  async saveDestination(): Promise<void> {
    if (this.destinationForm.invalid) {
      this.destinationForm.markAllAsTouched();
      return;
    }

    const formValues = this.destinationForm.value;

    if (this.isEditing() && this.editingId()) {
      await this.destinationStore.updateDestination(this.editingId()!, formValues);
    } else {
      await this.destinationStore.addDestination(formValues);
    }

    this.closeModal();
  }

  toggleVisibility(dest: Destination): void {
    this.destinationStore.toggleVisibility(dest.id);
  }

  openDeleteModal(dest: Destination): void {
    this.selectedDestinationToDelete.set(dest);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.selectedDestinationToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const target = this.selectedDestinationToDelete();
    if (target) {
      await this.destinationStore.deleteDestination(target.id);
      this.closeDeleteModal();
    }
  }
}
