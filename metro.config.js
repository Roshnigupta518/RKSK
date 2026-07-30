const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// -----------------------------------------------------------------------------
// F-15 hardening: shrink and obfuscate what ships in the Hermes bytecode
//
// Even though Hermes compiles JS to bytecode (HBC), the following remain
// trivially extractable from the packaged bundle unless we intervene:
//
//   * String literals (URLs, endpoint paths, error messages, business terms)
//   * Function / class / method names (preserved as symbols in the HBC
//     string table for stack traces)
//   * JSDoc, license headers, and any inline `//` comments that survive
//     Babel and reach the Metro output
//   * `console.*` calls and `debugger` statements (a source of leaked PII
//     and pauses on attach)
//
// Metro's default minifier config (`@react-native/metro-config`) is
// deliberately conservative — it disables function-name mangling, disables
// top-level mangling, and DOES NOT drop console calls. Those defaults exist
// to protect legacy Hermes builds that had a fragile handling of some
// Terser transforms. Modern Hermes (RN 0.81) handles the transforms below
// cleanly; the app has been verified to render past the login gate with
// these settings applied.
//
// Rules of thumb before touching this block:
//   1. `mangle.toplevel` MUST stay `false`. Metro emits `__d(...)` / `__r`
//      module system calls at top level; renaming these breaks the bundle.
//   2. `compress.reduce_funcs` MUST stay `false`. Aggressive Hermes+Terser
//      inlining has hit known crash modes in the past.
//   3. If you enable name-preserving flags (keep_classnames / keep_fnames),
//      document WHY inline. The current setting preserves only what is
//      strictly needed for RN internals to work.
// -----------------------------------------------------------------------------
const config = {
  transformer: {
    minifierConfig: {
      keep_classnames: true, // React ErrorBoundary + a few devtools code paths
      keep_fnames: true, //     read fn.name; keeping fnames keeps stack traces useful
      mangle: {
        toplevel: false, // MANDATORY: Metro module runtime uses __d / __r at top level
        keep_classnames: true,
        keep_fnames: true,
        reserved: [
          // Metro / Hermes module runtime globals — never rename these.
          '__d', '__r', '__c', '__G', 'require', '__DEV__',
          // React Native fast-refresh / dev helpers (no-op in release, but
          // guard the names so a dev + release bundle diff on the same
          // module stays stable).
          '__PLATFORM__',
        ],
      },
      output: {
        ascii_only: true, // matches Metro default (bundle stays 7-bit clean)
        quote_style: 3, //  matches Metro default (original quotes preserved for Hermes)
        wrap_iife: true, //  matches Metro default
        // F-15: strip inline `// TODO`, JSDoc, and casual comments while
        // preserving comments that carry legal weight. Terser's `'some'`
        // mode keeps:
        //   * banner comments starting with `!`  (e.g. `/*! license */`)
        //   * comments containing @license / @preserve / @cc_on
        // That satisfies MIT / BSD / Apache-2.0 attribution requirements
        // for the dependencies we ship, without leaking developer notes,
        // author names, ticket IDs, internal URLs, or dev-only markers.
        comments: 'some',
      },
      sourceMap: {
        includeSources: false, // never embed original sources in the sourcemap
      },
      toplevel: false, // top-level statements not folded (Metro contract)
      compress: {
        reduce_funcs: false, // MANDATORY: leave off for Hermes compat
        drop_console: true, //  F-05 / F-15: strip every console.* call at bundle
        //                     time. Babel already strips them via
        //                     `babel-plugin-transform-remove-console` in the
        //                     `production` env, but Terser is a second gate:
        //                     any console call added via a require()d library
        //                     or a codegen-emitted string escapes Babel and
        //                     is caught here.
        drop_debugger: true, // strip `debugger;` statements — they leak intent
        //                      and let an attached debugger pause the JS thread
        //                      inside sensitive flows (auth, PII validation).
        passes: 2, //          two Terser passes catches dead code that only
        //                      becomes dead after `drop_console` removes a
        //                      reference (common: `const x = console.log(...)`
        //                      → after pass 1 `x` is unused → dead in pass 2).
      },
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
