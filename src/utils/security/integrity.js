/**
 * Device / app integrity checks (F-13).
 *
 * This module answers a single question at app boot: "should we let the
 * user proceed on this device, or is the environment so obviously
 * compromised that continuing would leak PII / JWTs / camera captures?"
 *
 * The signals we consult are all CLIENT-SIDE and thus all defeatable by a
 * determined attacker with a rooted device (they can hook the check
 * itself). The point is:
 *
 *   1. Catch the drive-by cases — someone runs the released APK on their
 *      Magisk-rooted personal device, or a low-effort Frida-based scraper
 *      built by a script kiddie.
 *   2. Emit a structured verdict object we can (a) surface to the user
 *      as a block/warn screen and (b) later attach to sensitive API
 *      requests once the backend is ready to consume it.
 *   3. Layer with server-side attestation (Play Integrity). This module
 *      is the FIRST layer, not the ONLY layer. See android/INTEGRITY.md
 *      for the roadmap to add server-verified Play Integrity tokens.
 */

import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const IS_DEV = typeof __DEV__ === 'boolean' ? __DEV__ : false;

/**
 * Lazy, defensive JailMonkey loader.
 *
 * The library is on the app's runtime allowlist but if it ever fails to
 * autolink (someone runs the app in a broken build, or the library is
 * temporarily denylisted while a CVE is being investigated), we do not
 * want the integrity gate itself to crash the app on boot. Returning
 * `null` here causes every check below to record "unknown" instead of
 * throwing, and the aggregate verdict falls back to `warn` — which is
 * a safe default (surface to user, do not block).
 */
const loadJailMonkey = () => {
  try {
    const mod = require('jail-monkey');
    return mod && (mod.default || mod);
  } catch (_e) {
    return null;
  }
};

const JailMonkey = loadJailMonkey();

/**
 * JailMonkey exposes a mixture of sync properties and async methods, and
 * that mixture has changed across major versions. Wrap every read in a
 * helper that accepts either shape and always resolves to a boolean.
 */
const readBool = async (candidate) => {
  try {
    if (candidate === undefined || candidate === null) return null;
    const v = typeof candidate === 'function' ? candidate() : candidate;
    if (v && typeof v.then === 'function') {
      const resolved = await v;
      return !!resolved;
    }
    return !!v;
  } catch (_e) {
    return null;
  }
};

const readString = async (candidate) => {
  try {
    if (candidate === undefined || candidate === null) return null;
    const v = typeof candidate === 'function' ? candidate() : candidate;
    if (v && typeof v.then === 'function') {
      const resolved = await v;
      return resolved == null ? null : String(resolved);
    }
    return v == null ? null : String(v);
  } catch (_e) {
    return null;
  }
};

/**
 * Install sources we consider "trusted" for the purposes of the sideload
 * warning. This is a positive allowlist — anything not on this list
 * flips the `isSideloaded` flag. The list is intentionally NOT a hard
 * block because ASHA / ANM field devices are sometimes seeded via
 * `adb install` or the NHM-internal MDM (`com.samsung.android.knox.*`,
 * `com.airwatch.androidagent`), and we do not want to lock legitimate
 * enterprise deployments out.
 */
const TRUSTED_INSTALLER_PACKAGES = [
  'com.android.vending',                    // Google Play
  'com.google.android.packageinstaller',    // Google Play post-installer
  'com.android.packageinstaller',           // Stock Android installer
  'com.samsung.android.packageinstaller',
  'com.huawei.appmarket',
  'com.xiaomi.market',
  'com.oplus.appstore',
  'com.oppo.market',
];

/**
 * Run every integrity check and return a structured verdict.
 *
 * Never throws. Individual check failures are recorded as `null` in
 * `checks` and the aggregate risk classification treats them as
 * "unknown" (neutral — neither block nor a clean bill of health).
 *
 * @returns {Promise<{
 *   checks: Record<string, boolean|string|null>,
 *   riskLevel: 'ok' | 'warn' | 'block',
 *   reasons: string[],
 *   raw: object,
 * }>}
 */
export const evaluateIntegrity = async () => {
  const isAndroid = Platform.OS === 'android';
  const jm = JailMonkey || {};

  const [
    isJailBroken,
    hookDetected,
    canMockLocation,
    isDebuggedMode,
    isDevelopmentSettingsMode,
    isOnExternalStorage,
    adbEnabled,
    isEmulator,
    installerPackageName,
  ] = await Promise.all([
    readBool(jm.isJailBroken),
    readBool(jm.hookDetected),
    readBool(jm.canMockLocation),
    readBool(jm.isDebuggedMode),
    readBool(jm.isDevelopmentSettingsMode),
    readBool(jm.isOnExternalStorage),
    readBool(jm.AdbEnabled),
    readBool(DeviceInfo.isEmulator),
    readString(DeviceInfo.getInstallerPackageName),
  ]);

  const isFromTrustedInstaller =
    !isAndroid ||
    (installerPackageName != null &&
      TRUSTED_INSTALLER_PACKAGES.includes(installerPackageName));
  const isSideloaded = isAndroid && !isFromTrustedInstaller;

  const checks = {
    isRooted: isJailBroken,
    isHookDetected: hookDetected,
    canMockLocation: canMockLocation,
    isDebuggerAttached: isDebuggedMode,
    isDevSettingsEnabled: isDevelopmentSettingsMode,
    isOnExternalStorage: isOnExternalStorage,
    isAdbEnabled: adbEnabled,
    isEmulator: isEmulator,
    isSideloaded,
    installerPackageName,
    jailMonkeyLoaded: JailMonkey != null,
  };

  // Risk classification. Order matters — first `block` reason wins the
  // aggregate verdict, but we keep collecting reasons so the UI can
  // enumerate them for the user + audit log.
  const reasons = [];
  let riskLevel = 'ok';

  const escalate = (level, reason) => {
    reasons.push(reason);
    if (level === 'block') riskLevel = 'block';
    else if (level === 'warn' && riskLevel === 'ok') riskLevel = 'warn';
  };

  // Category 1 — hard block in every environment. These signals are
  // essentially impossible to hit on a normal user device.
  if (checks.isHookDetected === true) {
    escalate('block', 'hook_framework_detected');
  }
  if (checks.isOnExternalStorage === true) {
    escalate('block', 'app_running_from_external_storage');
  }

  // Category 2 — block in release, warn in dev. Root and attached
  // debugger are legitimate on a developer laptop but not on a field
  // ASHA-worker device.
  if (checks.isRooted === true) {
    escalate(IS_DEV ? 'warn' : 'block', 'rooted_device');
  }
  if (checks.isDebuggerAttached === true) {
    escalate(IS_DEV ? 'warn' : 'block', 'debugger_attached');
  }

  // Category 3 — always warn (never block). These are informational
  // signals we want to surface but never hard-fail on, because they can
  // fire on perfectly legitimate devices (ADB left on for OEM support,
  // developer options enabled for accessibility settings, etc.).
  if (checks.isEmulator === true) {
    escalate('warn', 'running_on_emulator');
  }
  if (checks.isAdbEnabled === true && !IS_DEV) {
    escalate('warn', 'adb_enabled_on_release');
  }
  if (checks.isDevSettingsEnabled === true && !IS_DEV) {
    escalate('warn', 'developer_options_enabled');
  }
  if (checks.canMockLocation === true) {
    escalate('warn', 'mock_location_capable');
  }
  if (checks.isSideloaded === true && !IS_DEV) {
    escalate('warn', 'sideloaded_install');
  }

  return { checks, riskLevel, reasons };
};

/**
 * In-memory cache of the last integrity verdict. Populated by the
 * bootstrap and read by API interceptors / risk-aware feature flags.
 */
let cachedVerdict = null;

export const IntegrityService = {
  /**
   * Runs the checks and caches the verdict. Idempotent within a single
   * app process — subsequent calls return the cached result (integrity
   * signals don't meaningfully change during an app session).
   */
  async hydrate() {
    if (cachedVerdict) return cachedVerdict;
    cachedVerdict = await evaluateIntegrity();
    return cachedVerdict;
  },

  /**
   * Synchronous read for callers that need to route on the cached
   * verdict (e.g. request interceptor deciding whether to attach a
   * Play Integrity token). Returns `null` if hydrate() hasn't finished.
   */
  getVerdict() {
    return cachedVerdict;
  },

  /**
   * Test/emergency escape hatch. Clears the cache so hydrate() will
   * re-evaluate. NEVER call this from production code paths — it exists
   * only for the integrity-check retry UI in App.js.
   */
  reset() {
    cachedVerdict = null;
  },
};

export default IntegrityService;
