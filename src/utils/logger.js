/**
 * PII-redacting logger for RKSK.
 *
 * Purpose (F-05):
 *   - Production release bundles: silent no-op. The babel plugin
 *     `transform-remove-console` already strips every `console.*` call
 *     from the release Hermes bundle; this module is a belt-and-braces
 *     second line of defence so even a bundle built without the plugin
 *     cannot leak PII in production.
 *   - Dev/debug bundles: forwards to `console.*` but first recursively
 *     redacts any property or string value that looks like a credential,
 *     token, session ID, email, phone number, or bearer header.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('login response', response);
 *   logger.error('sync failed', err);
 *
 * Never call `console.log(token)` / `console.log({data: {...pii}})` /
 * `console.log(response)` directly — route everything through logger.
 */

// __DEV__ is a global injected by React Native. In release builds it is
// statically replaced with `false`, allowing dead-code elimination.
const IS_DEV = typeof __DEV__ === 'boolean' ? __DEV__ : false;

const REDACTED = '[REDACTED]';
const REDACTED_JWT = '[REDACTED-JWT]';

// Any object key whose lowercased form matches one of these is redacted.
const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /^jwt/i,
  /password/i,
  /^pass$/i,
  /passcode/i,
  /secret/i,
  /credential/i,
  /^authorization$/i,
  /^auth$/i,
  /bearer/i,
  /apikey/i,
  /^api_key$/i,
  /^otp$/i,
  /^pin$/i,
  /^email$/i,
  /^mobile$/i,
  /^phone$/i,
  /mobileNumber/i,
  /phoneNumber/i,
  /aadhaar/i,
  /^ssn$/i,
];

const isSensitiveKey = (key) => {
  if (typeof key !== 'string') return false;
  for (let i = 0; i < SENSITIVE_KEY_PATTERNS.length; i++) {
    if (SENSITIVE_KEY_PATTERNS[i].test(key)) return true;
  }
  return false;
};

// Heuristic JWT match: three base64url segments separated by dots.
const JWT_REGEX = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9._-]+/gi;

const redactString = (str) => {
  if (typeof str !== 'string' || str.length === 0) return str;
  return str.replace(JWT_REGEX, REDACTED_JWT).replace(BEARER_REGEX, `Bearer ${REDACTED}`);
};

const MAX_DEPTH = 6;

const redact = (value, seen, depth) => {
  if (value == null) return value;
  const t = typeof value;
  if (t === 'string') return redactString(value);
  if (t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') return value;
  if (t === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (depth > MAX_DEPTH) return '[…truncated]';

  // Handle Error objects specifically so stack traces still surface.
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: redactString(value.stack || ''),
    };
  }

  // Leave non-plain objects (Date, RegExp, Map, Set, class instances) as-is
  // to preserve their toString semantics.
  if (t === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      const out = new Array(value.length);
      for (let i = 0; i < value.length; i++) {
        out[i] = redact(value[i], seen, depth + 1);
      }
      return out;
    }

    // Only walk plain objects; leave anything with a custom prototype alone.
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return String(value);
    }

    const out = {};
    for (const key of Object.keys(value)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redact(value[key], seen, depth + 1);
      }
    }
    return out;
  }

  return value;
};

const redactAll = (args) => {
  const seen = new WeakSet();
  const out = new Array(args.length);
  for (let i = 0; i < args.length; i++) {
    out[i] = redact(args[i], seen, 0);
  }
  return out;
};

const noop = () => {};

const build = (method) => {
  if (!IS_DEV) return noop;
  return (...args) => {
    try {
      console[method](...redactAll(args));
    } catch {
      console[method]('[logger] redaction failed for', method);
    }
  };
};

export const logger = {
  debug: build('log'),
  info: build('info'),
  log: build('log'),
  warn: build('warn'),
  error: build('error'),
};

export default logger;
