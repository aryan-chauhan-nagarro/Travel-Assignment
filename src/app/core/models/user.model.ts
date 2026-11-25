export type UserRole = 'admin' | 'user';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number; // in seconds (e.g. 900 for 15 minutes)
}

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface RegisteredUserRecord {
  uid: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}
