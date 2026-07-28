// =============================================================================
// EXAMPLE — copy this file to `env.js` (SAME directory) and fill in real
// values. `env.js` is git-ignored so the values stay on your dev machine.
//
//     cp src/utils/constant/env.example.js src/utils/constant/env.js
//
// This file is committed and MUST NOT contain real secrets. It exists only
// as a template so a fresh checkout knows which keys `constant/index.js`
// expects.
//
// See android/SECRETS.md for how to obtain a properly restricted Google
// Maps / Routes API key from the Google Cloud Console, and why the Routes
// API call in src/screens/dashboard/tracking/index.js should ultimately be
// proxied through the backend instead of being called with a mobile-side
// key at all.
// =============================================================================

export const envSecrets = {
  // Google API key used by src/screens/dashboard/tracking/index.js for the
  // client-side Routes API call. This value is baked into the JS bundle at
  // build time, so it WILL be extractable from a released APK — use Cloud
  // Console application + API restrictions to make an extracted copy useless.
  //
  // Long-term: move this call server-side (see android/SECRETS.md §4) and
  // then delete this entry entirely.
  GOOGLE_API_KEY: 'REPLACE_WITH_ROUTES_API_KEY_FROM_CLOUD_CONSOLE',
};

export default envSecrets;
