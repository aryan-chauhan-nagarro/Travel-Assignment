import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from './jwt.service';

/**
 * ==============================================================================
 * jwtInterceptor (Functional HTTP Interceptor)
 * ==============================================================================
 * Interview Concept:
 * - Angular 17+ HttpInterceptorFn replaces legacy Class-based HttpInterceptor.
 * - Injected globally in appConfig via `provideHttpClient(withInterceptors([jwtInterceptor]))`.
 * - Intercepts all outgoing HTTP requests from Angular's HttpClient.
 * - If a valid, non-expired JWT Access Token exists, it clones the request and appends:
 *     Authorization: Bearer <accessToken>
 * - If no token or if expired, it passes the request unchanged.
 * ==============================================================================
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = jwtService.accessToken() || jwtService.getStoredAccessToken();

  // If token exists and has not expired, attach Authorization header
  if (token && !jwtService.isTokenExpired(token)) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  // Pass through original request
  return next(req);
};
