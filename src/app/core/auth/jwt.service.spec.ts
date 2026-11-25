import { TestBed } from '@angular/core/testing';
import { JwtService } from './jwt.service';
import { AppUser } from '../models';

describe('JwtService', () => {
  let service: JwtService;

  const mockUser: AppUser = {
    uid: 'test-user-123',
    name: 'Test Traveler',
    email: 'traveler@test.com',
    role: 'user',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [JwtService],
    });
    service = TestBed.inject(JwtService);
  });

  afterEach(() => {
    service.clearTokens();
    localStorage.clear();
  });

  it('should generate valid access and refresh tokens for a user', () => {
    const tokens = service.generateTokens(mockUser);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.tokenType).toBe('Bearer');
    expect(tokens.expiresIn).toBe(900); // 15 mins
  });

  it('should correctly decode token payload', () => {
    const tokens = service.generateTokens(mockUser);
    const decoded = service.decodeToken(tokens.accessToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(mockUser.uid);
    expect(decoded?.email).toBe(mockUser.email);
    expect(decoded?.role).toBe('user');
    expect(decoded?.type).toBe('access');
  });

  it('should identify unexpired tokens as valid', () => {
    const tokens = service.generateTokens(mockUser);
    expect(service.isTokenExpired(tokens.accessToken)).toBe(false);
    expect(service.hasValidToken()).toBe(true);
  });

  it('should refresh access token using valid refresh token', () => {
    service.generateTokens(mockUser);
    const oldAccessToken = service.getStoredAccessToken();

    const refreshed = service.refreshAccessToken();
    expect(refreshed).not.toBeNull();
    expect(refreshed?.accessToken).toBeDefined();
    expect(service.getStoredAccessToken()).toBeDefined();
  });

  it('should clear stored tokens on logout', () => {
    service.generateTokens(mockUser);
    expect(service.getStoredAccessToken()).not.toBeNull();

    service.clearTokens();
    expect(service.getStoredAccessToken()).toBeNull();
    expect(service.getStoredRefreshToken()).toBeNull();
    expect(service.hasValidToken()).toBe(false);
  });
});
