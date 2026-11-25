import { Component, input, output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Destination } from '../../../core/models';

@Component({
  selector: 'app-destination-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './destination-card.component.html',
  styleUrl: './destination-card.component.scss',
})
export class DestinationCardComponent {
  readonly destination = input.required<Destination>();
  readonly cardClick = output<Destination>();

  onCardClick(): void {
    this.cardClick.emit(this.destination());
  }
}
