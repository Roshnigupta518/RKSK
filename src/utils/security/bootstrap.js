/**
 * Security bootstrap.
 *
 * Runs once at app start, BEFORE the redux store & persistor mount.
 * Guarantees:
 *   1. The at-rest encryption key exists in Keychain and is cached
 *      synchronously for the redux-persist transform (F-04).
 *   2. The session JWT (if any prior session exists) is warmed into
 *      the SecureTokenService in-memory cache so the API layer can
 *      attach it without an extra IPC on the first request (F-04).
 *   3. The device / app integrity verdict is evaluated and cached so
 *      App.js can gate the UI on it and API interceptors can attach
 *      it to sensitive requests (F-13).
 *
 * Integrity is checked LAST — a failed integrity verdict is not a
 * bootstrap error and never causes bootstrapSecurity() to reject. The
 * verdict is a data-only signal; App.js decides how to react to it.
 */

import EncryptionKeyService from './encryptionKey';
import SecureTokenService from './secureToken';
import IntegrityService from './integrity';

let bootstrapPromise = null;

export const bootstrapSecurity = () => {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await EncryptionKeyService.getOrCreate();
    await SecureTokenService.hydrate();
    // Integrity is best-effort. Wrap in a try so a broken JailMonkey
    // install can't take down the whole app boot; the cached verdict
    // simply won't populate and the gate in App.js falls open (with a
    // dev-visible console warning).
    try {
      await IntegrityService.hydrate();
    } catch (err) {
      console.warn('[security] integrity check failed:', err?.message || err);
    }
  })().catch((err) => {
    // Reset so a retry is possible on next render cycle.
    bootstrapPromise = null;
    throw err;
  });

  return bootstrapPromise;
};

export default bootstrapSecurity;
