/**
 * SecureTokenService
 * -------------------
 * Keeps the RKSK session JWT out of AsyncStorage / redux-persist SQLite
 * (RKStorage, plaintext). Instead, the token lives in the OS-managed
 * secret store:
 *   - Android: KeyStore-backed EncryptedSharedPreferences via Keychain
 *   - iOS:     Keychain (kSecClassGenericPassword)
 *
 * Public API is async because Keychain access is native / IPC. A tiny
 * in-memory cache is used so hot-path API calls do not pay the round-trip
 * on every request — the cache is authoritative only while the process
 * is alive.
 *
 * Addresses audit finding F-04 (JWT persisted plaintext in AsyncStorage).
 */

import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const JWT_SERVICE = 'com.rkskmp.auth.jwt';

let inMemoryToken = null;

// Keep the options minimal and cross-platform. Do NOT pin
// `securityLevel: SECURE_HARDWARE` — on emulators and older devices
// without a TEE this throws E_UNSUPPORTED_OPERATION and blocks login.
// The library already picks the strongest storage backend available on
// each device (hardware KeyStore on TEE-capable devices, software AES-GCM
// otherwise). iOS gets an "after first unlock, this device only"
// accessibility policy so the token cannot be exfiltrated via encrypted
// iCloud backup.
const iosOptions = Platform.OS === 'ios'
  ? { accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
  : {};

const persistOptions = {
  service: JWT_SERVICE,
  ...iosOptions,
};

const readOptions = { service: JWT_SERVICE };

export const SecureTokenService = {
  /**
   * Persist the JWT. Should be called from the login success handler.
   * @param {string} token - raw JWT string returned by the server.
   */
  async setToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('SecureTokenService.setToken: token must be a non-empty string');
    }
    inMemoryToken = token;
    try {
      await Keychain.setGenericPassword('rksk-session', token, persistOptions);
    } catch (err) {
      inMemoryToken = null;
      throw err;
    }
  },

  /**
   * Read the JWT. Uses an in-memory cache first, then Keychain.
   * @returns {Promise<string|null>}
   */
  async getToken() {
    if (inMemoryToken) return inMemoryToken;
    try {
      const creds = await Keychain.getGenericPassword(readOptions);
      if (creds && creds.password) {
        inMemoryToken = creds.password;
        return inMemoryToken;
      }
    } catch (err) {
      // Keychain read failure – treat as no token (forces re-login rather than crash).
    }
    return null;
  },

  /**
   * Synchronous accessor for hot paths that already hydrated once.
   * Returns `null` if the cache is cold; callers must fall back to
   * `getToken()` in that case.
   */
  getCachedToken() {
    return inMemoryToken;
  },

  /**
   * Warm the in-memory cache from Keychain. Call once at app boot before
   * any API call is dispatched.
   */
  async hydrate() {
    return this.getToken();
  },

  /**
   * Purge the JWT from both cache and Keychain. Call from logout and
   * from the 401 handler.
   */
  async clearToken() {
    inMemoryToken = null;
    try {
      await Keychain.resetGenericPassword(readOptions);
    } catch (err) {
      // Non-fatal: token cache is already cleared.
    }
  },
};

export default SecureTokenService;
