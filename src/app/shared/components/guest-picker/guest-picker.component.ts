import { Component, input, output, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-guest-picker',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './guest-picker.component.html',
  styleUrl: './guest-picker.component.scss',
})
export class GuestPickerComponent {
  readonly initialGuests = input<number>(1);
  readonly maxGuests = input<number>(16);

  readonly guestsChange = output<number>();

  isOpen = false;
  readonly adults = signal<number>(1);
  readonly children = signal<number>(0);
  readonly infants = signal<number>(0);

  readonly totalGuests = computed(() => this.adults() + this.children());

  readonly summaryText = computed(() => {
    const total = this.totalGuests();
    let text = total === 1 ? '1 guest' : `${total} guests`;
    const inf = this.infants();
    if (inf > 0) {
      text += `, ${inf} ${inf === 1 ? 'infant' : 'infants'}`;
    }
    return text;
  });

  constructor() {
    // Synchronize internal signals whenever parent inputs change
    effect(() => {
      const init = this.initialGuests();
      if (init && init !== this.totalGuests()) {
        this.adults.set(Math.max(1, init));
        this.children.set(0);
        this.infants.set(0);
      }
    });
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  updateAdults(delta: number): void {
    const next = this.adults() + delta;
    if (next >= 1 && this.totalGuests() + delta <= this.maxGuests()) {
      this.adults.set(next);
      this.emitChange();
    }
  }

  updateChildren(delta: number): void {
    const next = this.children() + delta;
    if (next >= 0 && this.totalGuests() + delta <= this.maxGuests()) {
      this.children.set(next);
      this.emitChange();
    }
  }

  updateInfants(delta: number): void {
    const next = this.infants() + delta;
    if (next >= 0 && next <= 5) {
      this.infants.set(next);
    }
  }

  private emitChange(): void {
    this.guestsChange.emit(this.totalGuests());
  }
}
