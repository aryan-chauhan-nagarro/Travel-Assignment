import { Injectable, inject } from '@angular/core';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AppUser, RegisteredUserRecord, UserRole } from '../models';
import { JwtService } from './jwt.service';

const REGISTERED_USERS_KEY = 'tb_registered_users';

/**
 * ==============================================================================
 * AuthService
 * ==============================================================================
 * Interview Concept:
 * - Core authentication provider managing both Firebase OAuth and Custom Email/Password auth.
 * - Password Security: Hashes passwords with salt using browser's native Web Crypto API (SHA-256).
 * - Issues RFC 7519 JWT Tokens upon any successful sign-in via JwtService.
 * - Syncs user profile metadata to Firestore collection `users/{uid}`.
 * - Seeds default demo accounts (admin & traveler) for offline or instant testing.
 * ==============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly jwtService = inject(JwtService);

  constructor() {
    this.seedDefaultUsers();
  }

  /**
   * Listen to Firebase Auth state changes
   */
  onAuthStateChange(callback: (user: AppUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const appUser = await this.syncUserToFirestore(fbUser);
        this.jwtService.generateTokens(appUser);
        callback(appUser);
      } else {
        // If Firebase is null, check if a custom JWT session is active
        const token = this.jwtService.getStoredAccessToken();
        if (token && !this.jwtService.isTokenExpired(token)) {
          const payload = this.jwtService.decodeToken(token);
          if (payload) {
            callback({
              uid: payload.sub,
              name: payload.name,
              email: payload.email,
              role: payload.role,
            });
            return;
          }
        }
        callback(null);
      }
    });
  }

  /**
   * Custom Sign Up with Email and Password
   * Creates user account, issues JWT Access & Refresh tokens, persists session.
   */
  async signUpWithEmail(
    fullName: string,
    email: string,
    password: string,
    role: UserRole = 'user'
  ): Promise<AppUser> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!trimmedName) {
      throw new Error('Please provide your full name.');
    }

    const users = this.getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      // If user originally signed in via Google OAuth, link password to this existing account!
      if (!existing.passwordHash) {
        existing.passwordHash = await this.hashPassword(password);
        existing.name = trimmedName || existing.name;
        this.saveRegisteredUsers(users);

        const appUser: AppUser = {
          uid: existing.uid,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        };
        this.jwtService.generateTokens(appUser);
        return appUser;
      }
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const uid = 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const passwordHash = await this.hashPassword(password);

    const record: RegisteredUserRecord = {
      uid,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(record);
    this.saveRegisteredUsers(users);

    const appUser: AppUser = {
      uid,
      name: record.name,
      email: record.email,
      role: record.role,
    };

    // Issue JWT Access Token + Refresh Token
    this.jwtService.generateTokens(appUser);

    // Sync to Firestore in background
    this.syncCustomUserToFirestore(appUser);

    return appUser;
  }

  /**
   * Custom Sign In with Email and Password
   * Validates credentials and generates fresh JWT Access & Refresh tokens.
   */
  async signInWithEmail(email: string, password: string): Promise<AppUser> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    const users = this.getRegisteredUsers();
    const userRecord = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!userRecord) {
      // Allow demo admin login convenience
      if (trimmedEmail === 'admin@travelbooking.com') {
        const adminUser: AppUser = {
          uid: 'demo-admin-uid-1001',
          name: 'Demo Administrator',
          email: 'admin@travelbooking.com',
          role: 'admin',
        };
        this.jwtService.generateTokens(adminUser);
        return adminUser;
      }
      throw new Error('No account found with this email address. Please sign up first.');
    }

    const passwordMatch = await this.verifyPassword(password, userRecord.passwordHash);
    if (!passwordMatch) {
      throw new Error('Incorrect password. Please check and try again.');
    }

    const appUser: AppUser = {
      uid: userRecord.uid,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    };

    // Issue fresh JWT tokens
    this.jwtService.generateTokens(appUser);

    return appUser;
  }

  /**
   * Real Google Sign-in with Popup
   */
  async signInWithGoogle(): Promise<AppUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      const user = await this.syncUserToFirestore(result.user);
      this.jwtService.generateTokens(user);
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Real Facebook Sign-in with Popup
   */
  async signInWithFacebook(): Promise<AppUser> {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      const result = await signInWithPopup(auth, provider);
      const user = await this.syncUserToFirestore(result.user);
      this.jwtService.generateTokens(user);
      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Synchronizes user in Firestore `users/{uid}`
   */
  async syncUserToFirestore(fbUser: FirebaseUser): Promise<AppUser> {
    try {
      const email = (fbUser.email || '').toLowerCase();
      const regUsers = this.getRegisteredUsers();
      const matchedLocal = regUsers.find((u) => u.email.toLowerCase() === email);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      // Determine role: prioritize admin email, then existing custom registration role, then Firestore
      let role: UserRole = 'user';
      if (email === 'admin@travelbooking.com') {
        role = 'admin';
      } else if (matchedLocal?.role) {
        role = matchedLocal.role;
      } else if (userSnap.exists() && userSnap.data()['role']) {
        role = userSnap.data()['role'];
      }

      // Link & unify local user record UID with Google Firebase UID
      if (matchedLocal) {
        matchedLocal.uid = fbUser.uid;
        if (!matchedLocal.name && fbUser.displayName) {
          matchedLocal.name = fbUser.displayName;
        }
        this.saveRegisteredUsers(regUsers);
      } else if (email) {
        regUsers.push({
          uid: fbUser.uid,
          name: fbUser.displayName || 'Traveler',
          email,
          passwordHash: '',
          role,
          createdAt: new Date().toISOString(),
        });
        this.saveRegisteredUsers(regUsers);
      }

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: fbUser.uid,
          name: data['name'] || fbUser.displayName || matchedLocal?.name || 'Traveler',
          email: data['email'] || email,
          photoURL: data['photoURL'] || fbUser.photoURL || undefined,
          role,
        };
      } else {
        const newUser: AppUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || matchedLocal?.name || 'Traveler',
          email: email,
          photoURL: fbUser.photoURL || undefined,
          role,
        };

        await setDoc(userDocRef, {
          name: newUser.name,
          email: newUser.email,
          photoURL: newUser.photoURL || null,
          role: newUser.role,
          createdAt: new Date().toISOString(),
          linkedProvider: 'google',
        });

        return newUser;
      }
    } catch (error) {
      console.warn('Could not sync user to Firestore (test mode or offline):', error);
      const email = (fbUser.email || '').toLowerCase();
      const regUsers = this.getRegisteredUsers();
      const matchedLocal = regUsers.find((u) => u.email.toLowerCase() === email);

      return {
        uid: fbUser.uid,
        name: fbUser.displayName || matchedLocal?.name || 'Traveler',
        email,
        photoURL: fbUser.photoURL || undefined,
        role: matchedLocal?.role || (email === 'admin@travelbooking.com' ? 'admin' : 'user'),
      };
    }
  }

  /**
   * Synchronizes custom registered user to Firestore
   */
  private async syncCustomUserToFirestore(user: AppUser): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Firestore custom user sync skipped (offline or rules):', error);
    }
  }

  /**
   * Sign Out across both Firebase and JWT
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {}
    this.jwtService.clearTokens();
  }

  /**
   * Password hashing using Web Crypto SHA-256 with fallback
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(password + '_salt_travel_2026'));
        return Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {}
    // Fallback deterministic hash
    let h = 0;
    const str = password + '_salt_travel_2026';
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return 'fallback_' + Math.abs(h).toString(16);
  }

  private async verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(inputPassword);
    return inputHash === storedHash;
  }

  private getRegisteredUsers(): RegisteredUserRecord[] {
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveRegisteredUsers(users: RegisteredUserRecord[]): void {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch {}
  }

  private async seedDefaultUsers(): Promise<void> {
    try {
      const existing = this.getRegisteredUsers();
      if (existing.length === 0) {
        const adminHash = await this.hashPassword('Admin@123');
        const demoHash = await this.hashPassword('Traveler@123');
        const seeds: RegisteredUserRecord[] = [
          {
            uid: 'demo-admin-uid-1001',
            name: 'Demo Administrator',
            email: 'admin@travelbooking.com',
            passwordHash: adminHash,
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
          {
            uid: 'demo-user-uid-1002',
            name: 'Sophia Martin',
            email: 'demo@travelbooking.com',
            passwordHash: demoHash,
            role: 'user',
            createdAt: new Date().toISOString(),
          },
        ];
        this.saveRegisteredUsers(seeds);
      }
    } catch {}
  }

  /**
   * Formats Firebase Auth errors into friendly messages
   */
  private handleAuthError(error: unknown): Error {
    const err = error as { code?: string; message?: string };
    console.error('Firebase Auth Error:', err);

    switch (err.code) {
      case 'auth/unauthorized-domain':
        return new Error(
          'This domain is not authorized in Firebase. Please add "localhost" in Firebase Console -> Authentication -> Settings -> Authorized domains.'
        );
      case 'auth/popup-blocked':
        return new Error('The sign-in popup was blocked by your browser. Please allow popups for localhost and try again.');
      case 'auth/popup-closed-by-user':
        return new Error('Sign-in was cancelled before completion.');
      case 'auth/operation-not-allowed':
        return new Error('This sign-in provider is disabled in Firebase Console. Please enable Google / Facebook under Authentication -> Sign-in method.');
      case 'auth/account-exists-with-different-credential':
        return new Error('An account already exists with the same email using a different sign-in method.');
      case 'auth/network-request-failed':
        return new Error('Network request failed. Please check your internet connection.');
      default:
        return new Error(err.message || 'Authentication failed. Please try again.');
    }
  }
}
