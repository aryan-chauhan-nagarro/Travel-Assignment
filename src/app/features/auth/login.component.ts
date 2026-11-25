import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

/**
 * ==============================================================================
 * LoginComponent
 * ==============================================================================
 * Interview Concept:
 * - Standalone Angular Component with OnPush-friendly reactive signals.
 * - Reactive Forms (FormBuilder, FormGroup, FormControl) for both Sign In and Sign Up.
 * - Cross-field validation (Password match verification).
 * - Real-time password strength computation using Angular Signals (`computed()`).
 * - Return URL redirection support for protected routes (e.g., coming from /checkout).
 * ==============================================================================
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // Dependency Injection using modern Angular inject() function
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  /** Active view mode: 'signin' for existing users, 'signup' for new registrations */
  authMode = signal<'signin' | 'signup'>('signin');

  /** UI Signals controlling password input visibility toggles */
  showSignInPassword = signal(false);
  showSignUpPassword = signal(false);
  showSignUpConfirmPassword = signal(false);

  /**
   * Reactive Sign In Form
   * Controls: email, password, rememberMe
   */
  signInForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  /**
   * Reactive Sign Up Form
   * Controls: fullName, email, password, confirmPassword, agreeTerms
   */
  signUpForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [true, [Validators.requiredTrue]],
  });

  /**
   * Cross-Field Validation: Checks if password and confirmPassword match
   * Computed signal updates automatically whenever form values change.
   */
  signUpPasswordMismatch = computed(() => {
    const pw = this.signUpForm.get('password')?.value;
    const cpw = this.signUpForm.get('confirmPassword')?.value;
    return Boolean(pw && cpw && pw !== cpw);
  });

  /**
   * Password Strength Calculator
   * Dynamically evaluates password complexity (length, numbers, symbols)
   * Returns a score (1 to 4) and color for the UI progress bar.
   */
  passwordStrength = computed(() => {
    const pw = this.signUpForm.get('password')?.value || '';
    if (!pw) return { score: 0, label: '', color: '' };
    if (pw.length < 6) return { score: 1, label: 'Weak (min 6 characters)', color: '#e53e3e' };

    let score = 1;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { score: 2, label: 'Fair', color: '#dd6b20' };
    if (score === 3) return { score: 3, label: 'Good', color: '#3182ce' };
    return { score: 4, label: 'Strong', color: '#26d9b0' };
  });

  /**
   * Reads destination returnUrl query param (e.g. /checkout)
   * If user was redirected here by authGuard, we navigate back there after login.
   */
  get returnUrl(): string | undefined {
    return this.route.snapshot.queryParams['returnUrl'];
  }

  /** Switches between Sign In and Create Account tabs */
  setAuthMode(mode: 'signin' | 'signup'): void {
    this.authMode.set(mode);
  }

  /**
   * Submits Email/Password Sign In
   * Calls AuthStore.signInWithEmail() which validates credentials and issues JWT tokens.
   */
  async onSignInSubmit(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.signInForm.value;
    if (!email || !password) return;

    await this.authStore.signInWithEmail(email, password, this.returnUrl);
  }

  /**
   * Submits New User Registration
   * Hashes password via Web Crypto API, saves user locally, and issues JWT tokens.
   */
  async onSignUpSubmit(): Promise<void> {
    if (this.signUpForm.invalid || this.signUpPasswordMismatch()) {
      this.signUpForm.markAllAsTouched();
      return;
    }
    const { fullName, email, password } = this.signUpForm.value;
    if (!fullName || !email || !password) return;

    await this.authStore.signUpWithEmail(fullName, email, password, this.returnUrl);
  }

  /** Initiates Firebase Google Sign-In Popup */
  onGoogleLogin(): void {
    this.authStore.loginWithGoogle(this.returnUrl);
  }

  /** Initiates Firebase Facebook Sign-In Popup */
  onFacebookLogin(): void {
    this.authStore.loginWithFacebook(this.returnUrl);
  }

  /** 1-Click Fast Evaluation: Logs in as Administrator */
  onDemoAdminLogin(): void {
    this.authStore.loginAsDemoAdmin(this.returnUrl);
  }

  /** 1-Click Fast Evaluation: Logs in as Demo Traveler (Sophia Martin) */
  onDemoUserLogin(): void {
    this.authStore.loginAsDemoUser(this.returnUrl);
  }

  /** Logs out user, invalidating session and clearing JWT tokens */
  onLogout(): void {
    this.authStore.logout();
  }

  /** Fills demo admin credentials into the form */
  fillDemoAdminCredentials(): void {
    this.authMode.set('signin');
    this.signInForm.patchValue({
      email: 'admin@travelbooking.com',
      password: 'Admin@123',
    });
  }

  /** Fills demo traveler credentials into the form */
  fillDemoUserCredentials(): void {
    this.authMode.set('signin');
    this.signInForm.patchValue({
      email: 'demo@travelbooking.com',
      password: 'Traveler@123',
    });
  }
}
