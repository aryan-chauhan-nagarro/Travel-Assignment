import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  readonly rating = input.required<number>();
  readonly reviewCount = input<number | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly showText = input<boolean>(true);

  readonly formattedRating = computed(() => {
    const val = this.rating();
    return Number.isInteger(val) ? val.toFixed(1) : (Math.round(val * 100) / 100).toFixed(2);
  });
}
