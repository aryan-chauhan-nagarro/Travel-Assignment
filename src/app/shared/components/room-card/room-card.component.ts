import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, CurrencyFormatPipe],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.scss',
})
export class RoomCardComponent {
  readonly room = input.required<Room>();
  readonly isFavorite = input<boolean>(false);
  readonly nights = input<number | undefined>(undefined);
  readonly layout = input<'horizontal' | 'vertical'>('horizontal');

  readonly favoriteToggle = output<Room>();
  readonly roomClick = output<Room>();

  activeImageIndex = 0;

  prevImage(event: Event): void {
    event.stopPropagation();
    const len = this.room().images.length;
    this.activeImageIndex = (this.activeImageIndex - 1 + len) % len;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const len = this.room().images.length;
    this.activeImageIndex = (this.activeImageIndex + 1) % len;
  }

  setImage(index: number, event: Event): void {
    event.stopPropagation();
    this.activeImageIndex = index;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.room());
  }

  onCardClick(): void {
    this.roomClick.emit(this.room());
  }
}
