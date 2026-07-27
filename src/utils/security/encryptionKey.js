/**
 * Redux-persist encryption-key manager.
 *
 * Generates a 256-bit random secret on first launch and stores it in the
 * OS secret store (Android KeyStore / iOS Keychain). All redux-persist
 * slices then encrypt their at-rest payloads with this key via
 * `redux-persist-transform-encrypt`, so the ciphertext in AsyncStorage
 * (RKStorage SQLite) is unreadable without the platform-protected key.
 *
 * The key is *never* stored in AsyncStorage, in the JS bundle, or in
 * Redux state.
 *
 * Addresses audit finding F-04 (PII persisted plaintext).
 */

import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const KEY_SERVICE = 'com.rkskmp.persist.key';
const KEY_ACCOUNT = 'redux-persist';
const KEY_BYTES = 32; // 256-bit

let cachedKey = null;

// Same rationale as SecureTokenService: keep options minimal and let the
// library pick the strongest storage backend available on-device. Pinning
// `securityLevel: SECURE_HARDWARE` blocks emulators and TEE-less devices.
const iosOptions = Platform.OS === 'ios'
  ? { accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
  : {};

const persistOptions = {
  service: KEY_SERVICE,
  ...iosOptions,
};

const readOptions = { service: KEY_SERVICE };

const bytesToHex = (bytes) => {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    // eslint-disable-next-line no-bitwise
    const b = bytes[i] & 0xff;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
};

const generateRandomKeyHex = () => {
  // `react-native-get-random-values` is imported in index.js to polyfill
  // global.crypto.getRandomValues on Hermes. crypto-js (used by
  // redux-persist-transform-encrypt) also relies on this polyfill for its
  // per-encryption IV.
  const g = global.crypto || global.msCrypto;
  const buf = new Uint8Array(KEY_BYTES);
  if (g && typeof g.getRandomValues === 'function') {
    g.getRandomValues(buf);
  } else {
    console.warn(
      '[security] crypto.getRandomValues unavailable — falling back to Math.random. ' +
        'This is acceptable only during development; production builds must have a CSPRNG.',
    );
    for (let i = 0; i < KEY_BYTES; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(buf);
};

export const EncryptionKeyService = {
  /**
   * Read the persist encryption key from Keychain, creating one on first launch.
   * @returns {Promise<string>} hex-encoded 32-byte key
   */
  async getOrCreate() {
    if (cachedKey) return cachedKey;

    try {
      const existing = await Keychain.getGenericPassword(readOptions);
      if (existing && existing.password) {
        cachedKey = existing.password;
        return cachedKey;
      }
    } catch (err) {
      // fall through to generation
    }

    const fresh = generateRandomKeyHex();
    try {
      await Keychain.setGenericPassword(KEY_ACCOUNT, fresh, persistOptions);
      cachedKey = fresh;
      return cachedKey;
    } catch (err) {
      // Keychain write failure on some emulators / hardened profiles.
      // Keep the freshly-generated key resident in memory so the app can
      // continue this session — persistence layer will encrypt/decrypt
      // normally. On next boot we will simply regenerate; the persisted
      // ciphertext from this session will be unreadable and treated as
      // empty state, which is the correct fail-safe posture.
      console.warn(
        '[security] Keychain write failed for persist key; using ' +
          'in-memory key for this session only:',
        err?.message || err,
      );
      cachedKey = fresh;
      return cachedKey;
    }
  },

  /**
   * Synchronous accessor once bootstrap has completed. Throws if used
   * before `getOrCreate()` has resolved – catches wiring mistakes early.
   */
  getSync() {
    if (!cachedKey) {
      throw new Error(
        '[security] EncryptionKeyService.getSync called before bootstrap; ' +
          'ensure bootstrapSecurity() has awaited before store hydration.',
      );
    }
    return cachedKey;
  },

  /**
   * Wipe the encryption key. Use only when tearing down all encrypted
   * persisted state (e.g. app reset), because existing ciphertext will
   * become unrecoverable.
   */
  async destroy() {
    cachedKey = null;
    try {
      await Keychain.resetGenericPassword(readOptions);
    } catch (err) {
      // non-fatal
    }
  },
};

export default EncryptionKeyService;
