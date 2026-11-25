import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { AppUser } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly currentUser = input<AppUser | null>(null);
  readonly isAuthenticated = input<boolean>(false);
  readonly isAdmin = input<boolean>(false);

  readonly logout = output<void>();

  userMenuOpen = false;
  mobileDrawerOpen = false;

  signOut(): void {
    this.userMenuOpen = false;
    this.mobileDrawerOpen = false;
    this.logout.emit();
  }
}
