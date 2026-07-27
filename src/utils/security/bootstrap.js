/**
 * Security bootstrap.
 *
 * Runs once at app start, BEFORE the redux store & persistor mount.
 * Guarantees:
 *   1. The at-rest encryption key exists in Keychain and is cached
 *      synchronously for the redux-persist transform.
 *   2. The session JWT (if any prior session exists) is warmed into
 *      the SecureTokenService in-memory cache so the API layer can
 *      attach it without an extra IPC on the first request.
 *
 * Addresses audit finding F-04.
 */

import EncryptionKeyService from './encryptionKey';
import SecureTokenService from './secureToken';

let bootstrapPromise = null;

export const bootstrapSecurity = () => {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await EncryptionKeyService.getOrCreate();
    await SecureTokenService.hydrate();
  })().catch((err) => {
    // Reset so a retry is possible on next render cycle.
    bootstrapPromise = null;
    throw err;
  });

  return bootstrapPromise;
};

export default bootstrapSecurity;
