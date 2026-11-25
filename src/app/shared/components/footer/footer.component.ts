import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  emailInput = '';
  subscribed = false;

  onSubscribe(event: Event): void {
    event.preventDefault();
    if (this.emailInput.trim()) {
      this.subscribed = true;
      this.emailInput = '';
    }
  }
}
