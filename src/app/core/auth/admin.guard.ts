import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from './auth.store';
import { ToastService } from '../services/toast.service';

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
    toast.warning('Admin access required. Please sign in as administrator.');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  toast.error('Access denied. Administrator privileges required.');
  return router.createUrlTree(['/']);
};
