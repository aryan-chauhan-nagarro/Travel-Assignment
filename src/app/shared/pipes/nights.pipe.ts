import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nights',
  standalone: true,
})
export class NightsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const nights = Math.max(0, value ?? 0);
    return nights === 1 ? '1 night' : `${nights} nights`;
  }
}
