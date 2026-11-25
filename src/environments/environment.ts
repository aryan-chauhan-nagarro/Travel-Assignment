export const environment = {
  production: false,
  useMockBackend: false, // Set to true if running locally without Firebase project credentials
  firebase: {
    apiKey: "AIzaSyA4n4mHf4hBv1-xsh214kBXr8byFUhfnuE",
    authDomain: "travel-booking-app-f61c7.firebaseapp.com",
    projectId: "travel-booking-app-f61c7",
    storageBucket: "travel-booking-app-f61c7.firebasestorage.app",
    messagingSenderId: "1016321123226",
    appId: "1:1016321123226:web:64d60085aec5a51d1d1023",
    measurementId: "G-X8CVQB2PR2"
  },
  jwt: {
    secret: 'travel_booking_secure_jwt_secret_2026',
    accessTokenKey: 'tb_jwt_access_token',
    refreshTokenKey: 'tb_jwt_refresh_token',
    accessTokenExpirySeconds: 15 * 60, // 15 minutes (short-lived access token)
    refreshTokenExpirySeconds: 7 * 24 * 60 * 60, // 7 days (long-lived refresh token)
    tokenType: 'Bearer',
    issuer: 'travel-booking-auth',
  },
  demoAdmin: {
    email: 'admin@travelbooking.com',
    password: 'AdminPassword123!',
    role: 'admin' as const,
  },
  demoUser: {
    email: 'user@travelbooking.com',
    password: 'UserPassword123!',
    role: 'user' as const,
  },
};
