// -----------------------------------------------------------------------------
// React Native CLI / autolinking configuration.
//
// The `dependencies` block here is a HARD DENYLIST: even if a listed package
// somehow lands in node_modules (fresh `npm install <pkg>`, transitive
// dependency, or a `git pull` that reintroduces it), setting
// `platforms.{android,ios} = null` instructs the autolinker to SKIP wiring
// the package into the native build. That means:
//
//   - the module's ReactPackage is NOT added to android's PackageList.java,
//     so `NativeModules.<name>` is `undefined` at runtime,
//   - the module's AndroidManifest.xml is NOT merged into the app manifest,
//     so its `<uses-permission>` and `<queries>` declarations do NOT show
//     up in the final APK.
//
// Combined with `scripts/security-denylist.js` (invoked from postinstall)
// this makes accidental reintroduction of a banned package a hard build
// failure rather than a silent regression.
//
// See android/NATIVE_MODULES.md for the rationale behind each entry and
// what to consider before ever removing one from the list.
// -----------------------------------------------------------------------------
module.exports = {
    project: {
        ios: {},
        android: {},
    },
    assets: ['./src/assets/fonts'],
    dependencies: {
        // F-12: RNSendIntentModule (from react-native-send-intent) exposes
        // getPhoneNumber() and getVoicemailNumber() to JavaScript over the
        // RN bridge, and its AndroidManifest.xml requires the READ_PHONE_STATE
        // permission. A malicious or supply-chain-compromised JS bundle
        // could exfiltrate the user's phone / voicemail number without any
        // additional UI or permission prompt. The package was removed as
        // part of F-06 (duplicate FileProvider authority); this entry
        // ensures it stays gone.
        //
        // If you land here because autolinking is warning "found a
        // dependency with disabled autolinking for react-native-send-intent",
        // do NOT delete this block. Instead delete the package from
        // package.json — the offending JS caller should use
        // Linking.sendIntent(...) with an explicit ACTION_* string
        // (see src/hooks/useLocation.js for the reference pattern).
        'react-native-send-intent': {
            platforms: {
                android: null,
                ios: null,
            },
        },
    },
};
