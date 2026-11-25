import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly title = input<string>('No stays found');
  readonly description = input<string>('Try adjusting your search dates, guests, or filters to find available properties.');
  readonly actionText = input<string | undefined>(undefined);
  readonly actionClicked = output<void>();
}
