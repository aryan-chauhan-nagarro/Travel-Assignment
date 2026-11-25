import { Injectable, signal, computed } from '@angular/core';
import { AppUser, AuthTokens, JwtPayload } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Configuration constants loaded dynamically from environment.ts
 * Allows switching between development and production secrets.
 */
const ACCESS_TOKEN_KEY = environment.jwt.accessTokenKey;
const REFRESH_TOKEN_KEY = environment.jwt.refreshTokenKey;
const ACCESS_TOKEN_EXPIRY_SECONDS = environment.jwt.accessTokenExpirySeconds; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = environment.jwt.refreshTokenExpirySeconds; // 7 days
const JWT_SECRET = environment.jwt.secret;
const TOKEN_TYPE = environment.jwt.tokenType;

/**
 * ==============================================================================
 * JwtService
 * ==============================================================================
 * Interview Concept:
 * - RFC 7519 JSON Web Token implementation in pure TypeScript.
 * - Dual-Token Architecture:
 *   1. Access Token: Short-lived (15 mins) for stateless API authorization.
 *   2. Refresh Token: Long-lived (7 days) for silent renewal without re-login.
 * - Automatic background timer: Renews Access Token 60s before it expires.
 * - Reactive state via Angular Signals (_accessToken, _refreshToken, hasValidToken).
 * ==============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class JwtService {
  private readonly _accessToken = signal<string | null>(this.getStoredAccessToken());
  private readonly _refreshToken = signal<string | null>(this.getStoredRefreshToken());

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();

  readonly hasValidToken = computed(() => {
    const token = this._accessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  });

  readonly tokenDetails = computed(() => {
    const token = this._accessToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload) return null;
    const expiresAt = new Date(payload.exp * 1000);
    const isExpired = Date.now() >= payload.exp * 1000;
    return {
      email: payload.email,
      role: payload.role,
      expiresAt,
      isExpired,
      type: payload.type,
    };
  });

  private refreshTimeoutTimer: any = null;

  constructor() {
    this.setupAutoRefreshTimer();
  }

  /**
   * Generates a pair of JWT Access Token (15m) and Refresh Token (7d) for an AppUser.
   */
  generateTokens(user: AppUser): AuthTokens {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    const accessPayload: JwtPayload = {
      sub: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      iat: nowInSeconds,
      exp: nowInSeconds + ACCESS_TOKEN_EXPIRY_SECONDS,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      iat: nowInSeconds,
      exp: nowInSeconds + REFRESH_TOKEN_EXPIRY_SECONDS,
      type: 'refresh',
    };

    const accessToken = this.encodeJwt(accessPayload);
    const refreshToken = this.encodeJwt(refreshPayload);

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      tokenType: TOKEN_TYPE,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Decodes a JWT token without verification to read header and payload.
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadJson = this.base64UrlDecode(parts[1]);
      return JSON.parse(payloadJson) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Checks if a token is expired according to its `exp` claim.
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds;
  }

  /**
   * Validates the refresh token and creates a fresh access token.
   */
  refreshAccessToken(userProvider?: (uid: string) => AppUser | null): AuthTokens | null {
    const currentRefreshToken = this.getStoredRefreshToken();
    if (!currentRefreshToken) {
      this.clearTokens();
      return null;
    }

    if (this.isTokenExpired(currentRefreshToken)) {
      this.clearTokens();
      return null;
    }

    const payload = this.decodeToken(currentRefreshToken);
    if (!payload || payload.type !== 'refresh') {
      this.clearTokens();
      return null;
    }

    let user: AppUser;
    if (userProvider) {
      const found = userProvider(payload.sub);
      if (found) {
        user = found;
      } else {
        user = {
          uid: payload.sub,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        };
      }
    } else {
      user = {
        uid: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
    }

    // Generate fresh tokens
    return this.generateTokens(user);
  }

  /**
   * Persists tokens in localStorage and signals.
   */
  saveTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {}

    this._accessToken.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);

    this.setupAutoRefreshTimer();
  }

  /**
   * Clears stored tokens from storage and state.
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}

    this._accessToken.set(null);
    this._refreshToken.set(null);

    if (this.refreshTimeoutTimer) {
      clearTimeout(this.refreshTimeoutTimer);
      this.refreshTimeoutTimer = null;
    }
  }

  getStoredAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getStoredRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Sets up an automatic timer to refresh the access token 1 minute before it expires.
   */
  private setupAutoRefreshTimer(): void {
    if (this.refreshTimeoutTimer) {
      clearTimeout(this.refreshTimeoutTimer);
      this.refreshTimeoutTimer = null;
    }

    const token = this.getStoredAccessToken();
    if (!token) return;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return;

    const now = Math.floor(Date.now() / 1000);
    // Refresh 60 seconds before expiry
    const timeUntilRefreshSec = Math.max(5, payload.exp - now - 60);

    this.refreshTimeoutTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, timeUntilRefreshSec * 1000);
  }

  /**
   * Simple, fast Base64Url JWT encoding with mock HMAC signature.
   */
  private encodeJwt(payload: JwtPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.generateSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private generateSignature(data: string, secret: string): string {
    // Generate deterministic hex-based pseudo-HMAC representation
    let hash = 0;
    const combined = data + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return this.base64UrlEncode(`sig_${Math.abs(hash)}_${secret.length}`);
  }

  private base64UrlEncode(str: string): string {
    try {
      const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      ));
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    try {
      const decoded = atob(base64);
      return decodeURIComponent(
        Array.prototype.map.call(decoded, (c: string) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
    } catch {
      return atob(base64);
    }
  }
}
