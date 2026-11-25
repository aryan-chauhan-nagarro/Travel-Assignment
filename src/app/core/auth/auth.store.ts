import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { AppUser, UserRole } from '../models';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

/**
 * ==============================================================================
 * AuthStore (NgRx SignalStore)
 * ==============================================================================
 * Interview Concept:
 * - Signal-based State Management introduced in @ngrx/signals.
 * - Reactive single source of truth for user authentication and role-based permissions.
 * - Computed Signals: `isAuthenticated`, `isAdmin`, `role`, `jwtToken`, `jwtDetails`.
 * - Instant 0ms Hydration: Reads localStorage `tb_user` synchronously onInit, preventing navbar flicker.
 * - Defers Firebase Auth iframe cross-origin handshake via requestIdleCallback to preserve Lighthouse LCP.
 * ==============================================================================
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ user }, jwtService = inject(JwtService)) => ({
    isAuthenticated: computed(() => !!user()),
    isAdmin: computed(() => user()?.role === 'admin'),
    role: computed(() => user()?.role ?? (null as UserRole | null)),
    userName: computed(() => user()?.name ?? 'Guest'),
    userEmail: computed(() => user()?.email ?? ''),
    jwtToken: computed(() => jwtService.accessToken()),
    jwtDetails: computed(() => jwtService.tokenDetails()),
    hasValidJwt: computed(() => jwtService.hasValidToken()),
  })),

  withMethods((
    store,
    authService = inject(AuthService),
    jwtService = inject(JwtService),
    toast = inject(ToastService),
    router = inject(Router)
  ) => ({
    async signInWithEmail(email: string, password: string, returnUrl?: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const user = await authService.signInWithEmail(email, password);
        patchState(store, { user, loading: false, error: null });
        try {
          localStorage.setItem('tb_user', JSON.stringify(user));
        } catch {}
        toast.success(`Welcome back, ${user.name}!`);
        router.navigateByUrl(returnUrl || (user.role === 'admin' ? '/admin/destinations' : '/'));
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.';
        patchState(store, { loading: false, error: message });
        toast.error(message);
        return false;
      }
    },

    async signUpWithEmail(fullName: string, email: string, password: string, returnUrl?: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const user = await authService.signUpWithEmail(fullName, email, password, 'user');
        patchState(store, { user, loading: false, error: null });
        try {
          localStorage.setItem('tb_user', JSON.stringify(user));
        } catch {}
        toast.success(`Account created successfully! Welcome, ${user.name}!`);
        router.navigateByUrl(returnUrl || '/');
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        patchState(store, { loading: false, error: message });
        toast.error(message);
        return false;
      }
    },

    async loginWithGoogle(returnUrl?: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const user = await authService.signInWithGoogle();
        patchState(store, { user, loading: false, error: null });
        try {
          localStorage.setItem('tb_user', JSON.stringify(user));
        } catch {}
        toast.success(`Welcome back, ${user.name}!`);
        router.navigateByUrl(returnUrl || '/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed';
        patchState(store, { loading: false, error: message });
        toast.error(message);
      }
    },

    async loginWithFacebook(returnUrl?: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const user = await authService.signInWithFacebook();
        patchState(store, { user, loading: false, error: null });
        try {
          localStorage.setItem('tb_user', JSON.stringify(user));
        } catch {}
        toast.success(`Welcome, ${user.name}!`);
        router.navigateByUrl(returnUrl || '/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Facebook sign-in failed';
        patchState(store, { loading: false, error: message });
        toast.error(message);
      }
    },

    setUser(user: AppUser | null): void {
      patchState(store, { user, loading: false, error: null });
    },

    loginAsDemoAdmin(returnUrl?: string): void {
      const demoAdminUser: AppUser = {
        uid: 'demo-admin-uid-1001',
        name: 'Demo Administrator',
        email: 'admin@travelbooking.com',
        role: 'admin',
      };
      jwtService.generateTokens(demoAdminUser);
      patchState(store, { user: demoAdminUser, loading: false, error: null });
      try {
        localStorage.setItem('tb_user', JSON.stringify(demoAdminUser));
      } catch {}
      toast.success('Logged in as Administrator (Demo Mode)');
      router.navigateByUrl(returnUrl || '/admin/destinations');
    },

    loginAsDemoUser(returnUrl?: string): void {
      const demoUser: AppUser = {
        uid: 'demo-user-uid-1002',
        name: 'Sophia Martin',
        email: 'demo@travelbooking.com',
        role: 'user',
      };
      jwtService.generateTokens(demoUser);
      patchState(store, { user: demoUser, loading: false, error: null });
      try {
        localStorage.setItem('tb_user', JSON.stringify(demoUser));
      } catch {}
      toast.success('Logged in as Demo Traveler (Sophia Martin)');
      router.navigateByUrl(returnUrl || '/');
    },

    async logout(): Promise<void> {
      patchState(store, { loading: true });
      try {
        await authService.logout();
        try {
          localStorage.removeItem('tb_user');
        } catch {}
        patchState(store, { user: null, loading: false, error: null });
        toast.info('You have been logged out.');
        router.navigate(['/']);
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),

  withHooks({
    onInit(store, authService = inject(AuthService), jwtService = inject(JwtService)) {
      // 1. Instant 0ms hydration from localStorage or valid JWT token
      try {
        const cached = localStorage.getItem('tb_user');
        if (cached) {
          const user = JSON.parse(cached) as AppUser;
          store.setUser(user);
          // If no active access token but cached user, generate fresh tokens
          if (!jwtService.hasValidToken()) {
            jwtService.refreshAccessToken() || jwtService.generateTokens(user);
          }
        } else {
          // Check if valid JWT access/refresh token exists
          const refreshed = jwtService.refreshAccessToken();
          if (refreshed) {
            const payload = jwtService.decodeToken(refreshed.accessToken);
            if (payload) {
              const restoredUser: AppUser = {
                uid: payload.sub,
                name: payload.name,
                email: payload.email,
                role: payload.role,
              };
              store.setUser(restoredUser);
            } else {
              patchState(store, { loading: false });
            }
          } else {
            patchState(store, { loading: false });
          }
        }
      } catch {
        patchState(store, { loading: false });
      }

      // 2. Defer Firebase Auth cross-origin iframe handshake until after critical paint / LCP
      const initAuth = () => {
        authService.onAuthStateChange((user) => {
          if (user) {
            store.setUser(user);
            try {
              localStorage.setItem('tb_user', JSON.stringify(user));
            } catch {}
          }
        });
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(initAuth, { timeout: 3000 });
      } else {
        setTimeout(initAuth, 1500);
      }
    },
  })
);
