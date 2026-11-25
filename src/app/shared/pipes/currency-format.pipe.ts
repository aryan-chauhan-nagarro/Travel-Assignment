import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currencySymbol = '₹'): string {
    if (value === null || value === undefined || isNaN(value)) {
      return `${currencySymbol}0`;
    }
    return `${currencySymbol}${Math.round(value).toLocaleString()}`;
  }
}
