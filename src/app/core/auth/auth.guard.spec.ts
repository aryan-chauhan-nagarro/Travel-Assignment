import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { AuthStore } from './auth.store';
import { ToastService } from '../services/toast.service';

describe('Auth & Admin Route Guards', () => {
  let authStore: InstanceType<typeof AuthStore>;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/checkout/room-1' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        ToastService,
        {
          provide: Router,
          useValue: {
            createUrlTree: vi.fn((path, extras) => ({ path, extras })),
            navigate: vi.fn(),
            navigateByUrl: vi.fn(),
          },
        },
      ],
    });

    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      authStore.setUser({
        uid: 'user-123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
      });

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /login with returnUrl when user is not authenticated', () => {
      authStore.setUser(null);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).not.toBe(true);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/checkout/room-1' },
      });
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user has admin role', () => {
      authStore.setUser({
        uid: 'admin-1',
        name: 'Admin User',
        email: 'admin@travelbooking.com',
        role: 'admin',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should block and redirect regular user without admin role to /', () => {
      authStore.setUser({
        uid: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).not.toBe(true);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});
