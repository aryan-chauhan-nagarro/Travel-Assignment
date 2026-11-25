import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { BookedDateRange } from '../../../core/models';

interface CalendarDay {
  dateString: string;
  dayNumber: number;
  disabled: boolean;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
})
export class DateRangePickerComponent {
  readonly checkIn = input<string>('');
  readonly checkOut = input<string>('');
  readonly disabledRanges = input<BookedDateRange[]>([]);

  readonly datesChange = output<{ checkIn: string; checkOut: string }>();

  isOpen = false;
  viewDate = signal(new Date());

  readonly currentMonthTitle = computed(() => {
    return this.viewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly isPrevMonthDisabled = computed(() => {
    const now = new Date();
    const current = this.viewDate();
    return current.getFullYear() === now.getFullYear() && current.getMonth() <= now.getMonth();
  });

  readonly calendarDays = computed(() => {
    const current = this.viewDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];
    const days: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateString = `${year}-${mStr}-${dStr}`;

      const isPast = dateString < todayStr;
      const isBooked = this.disabledRanges().some(
        (range) => dateString >= range.start && dateString <= range.end
      );

      days.push({
        dateString,
        dayNumber: d,
        disabled: isPast || isBooked,
      });
    }

    return days;
  });

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  prevMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() - 1);
    this.viewDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() + 1);
    this.viewDate.set(d);
  }

  selectDate(dateStr: string): void {
    const inDate = this.checkIn();
    const outDate = this.checkOut();

    if (!inDate || (inDate && outDate)) {
      this.datesChange.emit({ checkIn: dateStr, checkOut: '' });
    } else if (inDate && !outDate) {
      if (dateStr < inDate) {
        this.datesChange.emit({ checkIn: dateStr, checkOut: '' });
      } else {
        this.datesChange.emit({ checkIn: inDate, checkOut: dateStr });
        this.isOpen = false;
      }
    }
  }

  clearDates(): void {
    this.datesChange.emit({ checkIn: '', checkOut: '' });
  }

  isStartDate(dateStr: string): boolean {
    return this.checkIn() === dateStr;
  }

  isEndDate(dateStr: string): boolean {
    return this.checkOut() === dateStr;
  }

  isInRange(dateStr: string): boolean {
    const inDate = this.checkIn();
    const outDate = this.checkOut();
    return Boolean(inDate && outDate && dateStr > inDate && dateStr < outDate);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  }
}
