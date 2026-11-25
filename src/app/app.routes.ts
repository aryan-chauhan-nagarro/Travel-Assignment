import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'rooms/:id',
    loadComponent: () => import('./features/room-details/room-details.component').then((m) => m.RoomDetailsComponent),
  },
  {
    path: 'checkout/:roomId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'booking-success/:bookingId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking-success/booking-success.component').then((m) => m.BookingSuccessComponent),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/my-bookings/my-bookings.component').then((m) => m.MyBookingsComponent),
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/favorites/favorites.component').then((m) => m.FavoritesComponent),
  },
  {
    path: 'saved-searches',
    canActivate: [authGuard],
    loadComponent: () => import('./features/saved-searches/saved-searches.component').then((m) => m.SavedSearchesComponent),
  },
  {
    path: 'admin/destinations',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/destinations/admin-destinations.component').then((m) => m.AdminDestinationsComponent),
  },
  {
    path: 'admin/hotels',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/hotels/admin-hotels.component').then((m) => m.AdminHotelsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
