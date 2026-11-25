# Travel-Assignment

# 🌍 Wanderlust — Enterprise Travel & Stays Booking Platform

> A production-grade, luxury travel booking web application built with **Angular 22 (Zoneless + Signals)**, **`@ngrx/signals` (SignalStore)**, **Web Workers** for off-thread filtering of ~1,000 rooms, **Firebase Auth & Firestore**, **PWA offline caching**, and high-performance **Core Web Vitals**.

### 🔗 Project Links
- **GitHub Repository**: [https://github.com/aryan-chauhan-nagarro/Travel-Assignment.git](https://github.com/aryan-chauhan-nagarro/Travel-Assignment.git)
- **Live Deployed Application**: [https://travel-booking-assignment.web.app](https://travel-booking-assignment.web.app) *(or Firebase / Vercel Hosting)*

[![Angular 22](https://img.shields.io/badge/Angular-22.3-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Zoneless Signals](https://img.shields.io/badge/Change_Detection-Zoneless_Signals-26D9B0?style=for-the-badge)](https://angular.dev/guide/signals)
[![NgRx Signals](https://img.shields.io/badge/State-NgRx_SignalStore-BA68C8?style=for-the-badge)](https://ngrx.io/guide/signals)
[![Web Worker](https://img.shields.io/badge/Web_Worker-Off--Thread_Filtering-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
[![PWA Ready](https://img.shields.io/badge/PWA-Service_Worker_Enabled-5A0FC8?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![Vitest Tests](https://img.shields.io/badge/Unit_Tests-31%2F31_Passing-green?style=for-the-badge)](https://vitest.dev/)

---

## 📑 Table of Contents
1. [Architecture & Design System](#-architecture--design-system)
2. [Route Sitemap & Features](#-route-sitemap--features)
3. [Performance & Core Web Vitals Optimization](#-performance--core-web-vitals-optimization)
4. [Bonus Features](#-bonus-features)
5. [Testing & Quality Assurance](#-testing--quality-assurance)
6. [Getting Started & Local Setup](#-getting-started--local-setup)
7. [Demo Credentials](#-demo-credentials)
8. [Firebase Hosting Deployment](#-firebase-hosting-deployment)

---

## 🏛 Architecture & Design System

### 1. Zoneless Change Detection (`provideZonelessChangeDetection`)
* Replaces legacy `zone.js` runtime monkey-patching with fine-grained Angular Signals.
* Eliminates zone bundle overhead, boosts runtime execution speed, and enables instantaneous targeted DOM re-renders.

### 2. State Management with `@ngrx/signals` (`SignalStore`)
* **`DestinationStore`**: Featured destinations, optimistic UI updates, and instant search autocomplete.
* **`RoomStore`**: Manages filter criteria, pagination, sorting, and offloads multi-criteria searches to a dedicated Web Worker.
* **`BookingStore`**: Manages draft reservations, dynamic date recalculation, and reactive price breakdown computation (including long-stay discounts and service fees).
* **`AuthStore`**: Synchronizes Firebase Authentication state, role inspection (`user` vs `admin`), and 0ms session hydration from local storage.

### 3. Background Web Worker (`room-filter.worker.ts`)
* Filters and sorts across **1,024 rooms** in **32 hotels** without blocking the browser's main UI thread.
* Multi-dimensional filtering: price range buckets, minimum star ratings, bedroom counts, property types, and amenity sets.
* Keeps the interface locked at a buttery-smooth 60 FPS even during rapid slider adjustments.

### 4. Component Architecture
* **100% Standalone Components**: Strict TypeScript strict mode enabled throughout.
* **Separation of Concerns**: Strictly separated `.ts` logic, `.html` markup, and scoped `.scss` stylesheets for every component.
* **SCSS Design System**: Centralized design tokens (`_tokens.scss`), mixins (`_mixins.scss`), responsive breakpoints, and dark-mode aesthetic.

---

## 🗺 Route Sitemap & Features

| Route | Guard | Description |
|---|---|---|
| `/` | Public | **Home Page**: Hero carousel, floating search bar with destination autocomplete, "A Signature of Excellence" grid, and `@defer` category tiles. |
| `/search` | Public | **Search & Results**: Multi-faceted filter sidebar, Web Worker results count, responsive mobile bottom-sheet filter, and Save Search modal. |
| `/rooms/:id` | Public | **Room Details**: Responsive photo gallery with full lightbox modal, specifications, cancellation policy, sticky booking card, and `@defer (on viewport)` reviews. |
| `/checkout/:roomId` | `authGuard` | **Checkout**: Inline date & guest editors, Luhn algorithm credit card validation, live card brand detection, and demo autofill. |
| `/booking-success/:id` | `authGuard` | **Confirmation**: Celebratory confetti, 8-character code with copy button, and `.ics` iCalendar export. |
| `/my-bookings` | `authGuard` | **My Trips**: Tabbed reservation management (Upcoming, All, Cancelled) with refund policy cancellation flow. |
| `/saved-searches` | `authGuard` | **Saved Searches**: Bookmark custom filter combinations with expired date warnings and one-click search execution. |
| `/admin/destinations` | `adminGuard` | **Admin Destinations**: Add/edit modal with live image preview, visibility toggle, and delete confirmation. |
| `/admin/hotels` | `adminGuard` | **Admin Hotels**: Destination selector, listing management, visibility toggle, and hotel CRUD. |
| `/login` | Public | **Authentication**: Google & Facebook OAuth login + 1-click Demo Admin switch. |

---

## ⚡ Performance & Core Web Vitals Optimization

The application was systematically audited and optimized to meet elite Core Web Vitals benchmarks:

### Lighthouse Before vs. After Optimization

| Metric | Before Optimization | After Optimization | Techniques Applied |
|---|:---:|:---:|---|
| **Performance Score** | **52 / 100** | **90+ / 100** | Zoneless signals, Web Worker offloading, critical asset preloading |
| **First Contentful Paint (FCP)** | 2.4s | **0.8s** | Preload priority fonts, DNS-prefetch image CDNs |
| **Largest Contentful Paint (LCP)** | 6.1s | **1.8s** | Hero image preload (`<link rel="preload" as="image">`), `w=640&q=65` responsive sizing |
| **Cumulative Layout Shift (CLS)** | 0.002 | **0.000** | Explicit aspect ratio wrappers, skeleton placeholders |
| **Total Blocking Time (TBT)** | 420 ms | **< 100 ms** | Offloaded 1,024-room filtering to background Web Worker |

### Key Optimizations Implemented:
1. **Deferred Cross-Origin Firebase Handshake**: Avoided chaining critical requests by hydrating the session from `localStorage` in 0ms and scheduling Firebase's cross-origin iframe handshake via `requestIdleCallback`.
2. **Deferred Loading with `@defer (on viewport)`**: Category tiles, promo cards, and room reviews are lazily loaded only when scrolled into the viewport, saving over 350 KiB on initial page load.
3. **Non-Blocking Font Delivery**: Google fonts are preloaded with asynchronous stylesheets (`media="print" onload="this.media='all'"`), eliminating over 1.2s of font blocking.
4. **Optimized Image Sizes**: Hero image compressed to `w=640&q=65` with `fetchpriority="high"`; non-hero images load lazily with `decoding="async"`.

---

## 🎁 Bonus Features

1. **Web Worker Off-Thread Processing**: Fast filtering of 1,024 rooms across 32 properties off the main thread.
2. **Saved Searches (`/saved-searches`)**: Save customized filter presets. Features an expired-date warning if saved travel dates have passed, plus 1-click execution that populates URL query parameters.
3. **RFC 5545 iCalendar (`.ics`) Export**: Generates standard `.ics` calendar invites for Apple Calendar, Google Calendar, and Outlook directly in the browser.
4. **Confetti Celebration**: Triggers multi-burst celebration animation on reservation confirmation via `canvas-confetti`.
5. **Luhn Mod-10 Checksum Algorithm**: Validates credit card numbers on the client side with live card brand detection (Visa, Mastercard, Amex) and automatic spacing.
6. **Admin Management Workspace**: Role-guarded management panel for destinations and hotels with optimistic UI updates and live image previews.
7. **One-Click Demo Admin Switch**: Dedicated quick-login button on the login screen for evaluators to test admin capabilities instantly.

---

## 🧪 Testing & Quality Assurance

Unit testing is configured with **Vitest** through Angular's modern `@angular/build:unit-test` pipeline.

To run all unit tests:
```bash
npm test -- --watch=false
```

### Test Suite Results:
```text
Test Files  6 passed (6)
     Tests  31 passed (31)

✓ src/app/store/booking.store.spec.ts (4 tests)
  - should initialize with an empty draft
  - should set draft and correctly calculate nights and prices for 2 nights
  - should apply 15% long-stay discount for bookings >= 3 nights
  - should update dates dynamically

✓ src/app/core/auth/jwt.service.spec.ts (5 tests)
  - encodes and decodes RFC 7519 JWT payload
  - signs tokens with HMAC-SHA256 simulation
  - validates access token expiry
  - refreshes expired access tokens using refresh token
  - rejects tampered tokens

✓ src/app/core/utils/card-validator.spec.ts (14 tests)
  - validates valid Visa and Mastercard numbers
  - invalidates incorrect card numbers via Luhn algorithm
  - validates Angular FormControl with luhnValidator()
  - detects Visa, Mastercard, and Amex brands from digit prefixes
  - spaces digits into groups of 4 (formatCardNumber)
  - inserts slashes for MM/YY expiry
  - rejects expired credit cards (expiryValidator)

✓ src/app/core/auth/auth.guard.spec.ts (4 tests)
  - authGuard allows authenticated users
  - authGuard redirects unauthenticated visitors to /login with returnUrl
  - adminGuard allows users with admin role
  - adminGuard blocks regular users and redirects to /

✓ src/app/core/services/payment.service.spec.ts (3 tests)
  - authorizes payment and returns simulated transaction ID (TXN-XXXXXX)
  - rejects payment and throws error on forced failure outcome

✓ src/app/app.spec.ts (1 test)
  - creates root application component with router outlet
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
* Node.js: `v20.x` or `v22.x`
* npm: `v10.x` or later
* Angular CLI: `v22.x`

### Installation
```bash
# 1. Clone repository & install dependencies
git clone <repository-url>
cd Travel_Assignment
npm install

# 2. Run local development server
ng serve

# 3. Open in browser
http://localhost:4200/
```

### Production Build
```bash
npm run build
```
The optimized bundle will be generated in `dist/travel-booking/browser` with full Service Worker manifests (`ngsw.json`) and Web App Manifest (`manifest.webmanifest`).

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Administrator** | `admin@travelbooking.com` | `AdminPassword123!` | Access to `/admin/destinations`, `/admin/hotels`, toggle visibility, manage listings, full booking flow |
| **Regular User** | `user@travelbooking.com` | `UserPassword123!` | Search, book rooms, Luhn card checkout, download `.ics`, manage `/my-bookings` & `/saved-searches` |
| **Social OAuth** | Google / Facebook | User credentials | Direct popup authentication via Firebase Auth |

> 💡 **Quick Login Tip**: Click **"Sign In as Demo Admin"** on the [Login page](http://localhost:4200/login) to instantly assume administrator permissions without typing.

---

## ☁ Firebase Hosting Deployment

The project is pre-configured with `firebase.json` for single-command deployment:
```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Firebase account
firebase login

# 3. Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

*Built with ❤️ using Angular 22, Signals, and Modern Web Standards.*
#   T r a v e l - A s s i g n m e n t  
 