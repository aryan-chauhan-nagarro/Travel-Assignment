import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from './auth.store';
import { ToastService } from '../services/toast.service';

/**
 * ==============================================================================
 * authGuard (Functional Route Guard)
 * ==============================================================================
 * Interview Concept:
 * - CanActivateFn protects private routes (/checkout, /my-bookings).
 * - If user is logged in (authStore.isAuthenticated() === true), permits access.
 * - If unauthenticated, it preserves the attempted route in queryParams:
 *     /login?returnUrl=<attempted-url>
 *   and redirects to login, allowing seamless post-login return.
 * ==============================================================================
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authStore.isAuthenticated()) {
    return true;
  }

  toast.warning('Please sign in to continue.');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * ==============================================================================
 * adminGuard (Role-Based Access Control Guard)
 * ==============================================================================
 * Interview Concept:
 * - Restricts access to administrator management routes (/admin/**).
 * - Inspects authStore.isAdmin() (user.role === 'admin').
 * - Blocks regular customers with an 'Access denied' error and redirects to home.
 * ==============================================================================
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authStore.isAdmin()) {
    return true;
  }

  if (!authStore.isAuthenticated()) {
    toast.warning('Please sign in as an administrator.');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  toast.error('Access denied. Administrator privileges required.');
  return router.createUrlTree(['/']);
};
