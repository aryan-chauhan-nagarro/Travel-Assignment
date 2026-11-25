import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly borderRadius = input<string>('');
  readonly variant = input<'text' | 'rect' | 'circle' | 'card'>('rect');
}
