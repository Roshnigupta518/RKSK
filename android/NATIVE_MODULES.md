# RKSK Native Module Policy

This document explains which React Native native modules the RKSK app is
allowed to ship, how the two-layer denylist that enforces the policy is
structured, and the workflow for adding or removing entries. It closes
the L1 audit finding **F-12 — RNSendIntentModule phone/voicemail number
exposed to JS** and provides the mechanism to prevent regression on
similar findings in the future.

## Why this document exists

React Native's autolinking makes it trivial to bolt a native library into
the app: `npm install <package>` is enough to (a) merge the library's
`AndroidManifest.xml` (including any `<uses-permission>` declarations)
into the app manifest, and (b) register the library's `ReactPackage` in
`android/app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java`
so its methods become callable from JavaScript via `NativeModules.<name>`.

This convenience is a supply-chain footgun. A single accidental
`npm install` — a stale StackOverflow answer, a compromised transitive
dep, a junior dev's search — can:

- silently inflate the requested permission set the OS shows the user,
- expose PII-reading native methods (phone number, IMEI, SMS, call log)
  to any code path that can dispatch on `NativeModules`,
- open a bidirectional bridge between JavaScript (large attack surface,
  frequent library updates) and native platform APIs (highly privileged).

The policy below turns that from a silent regression into a hard failure.

## What was flagged

### F-12 — `react-native-send-intent`

The L1 audit found that `react-native-send-intent@1.3.0` was in the tree.
Its native module (`RNSendIntentModule.java`) exposed the following
methods to JavaScript:

| Bridge method | What it did | Sensitive because |
| --- | --- | --- |
| `getPhoneNumber(callback)` | Read `TelephonyManager.getLine1Number()` | Returns the user's MSISDN. Any JS that can reach the bridge can exfiltrate it. |
| `getVoiceMailNumber(callback)` | Read `TelephonyManager.getVoiceMailNumber()` | Same class of PII. |
| `sendPhoneDial(...)` / `sendPhoneCall(...)` | Fire `ACTION_DIAL` / `ACTION_CALL` with an attacker-supplied number | Bypasses the intended UI to place calls. |
| `openSettings(...)` / etc. | Dispatch `Intent(Settings.ACTION_*)` | The narrow legitimate use in RKSK, replaceable with `Linking.sendIntent(...)`. |

Its `AndroidManifest.xml` also declared `<uses-permission
android:name="android.permission.READ_PHONE_STATE"/>` (needed for the
telephony reads), which the manifest merger silently added to the app.

The library was removed as part of **F-06** (duplicate FileProvider
authority). This document ensures it stays removed.

## How the denylist is enforced

Two independent layers. Either one alone would be insufficient; together
they make regression a hard, loud failure at install time.

### Layer 1 — install-time guard (`scripts/security-denylist.js`)

Runs from the `postinstall` npm hook. It parses `package.json` and
checks every entry in `dependencies`, `devDependencies`,
`peerDependencies`, and `optionalDependencies` against a `DENYLIST`
array. If any match is found the install exits with a non-zero status
before `patch-package` runs, and the offending package is echoed with:

- the audit finding it violates,
- a one-line explanation of why it's dangerous, and
- the sanctioned replacement path.

Manual invocation:

```bash
npm run security:denylist
```

CI: `npm ci` triggers `postinstall` automatically, so any PR that
reintroduces a denylisted package fails the build.

### Layer 2 — autolinking short-circuit (`react-native.config.js`)

Even if Layer 1 is somehow bypassed (e.g. someone runs
`npm install --ignore-scripts`, which skips lifecycle hooks entirely),
this layer trips at Gradle assemble time. The `dependencies` block in
`react-native.config.js` sets `platforms.{android,ios} = null` for every
denylisted package. The React Native autolinker interprets this as
"do not wire this package into the native build", with two effects:

- the module's `ReactPackage` is NOT added to `PackageList.java`, so
  `NativeModules.<name>` resolves to `undefined` at runtime and any JS
  call to it throws immediately,
- the module's `AndroidManifest.xml` is NOT merged, so its
  `<uses-permission>` and `<queries>` declarations do not end up in the
  released APK.

### Keeping the two layers in sync

Every denylisted package **MUST** appear in both:

- `scripts/security-denylist.js` — the `DENYLIST` array, and
- `react-native.config.js` — the `dependencies` block.

If you add an entry to one and not the other, remove it from one and
not the other, or misspell the package name in one but not the other,
the enforcement will be partial and misleading. There is (deliberately)
no runtime cross-check because the whole point is that the two layers
are independent.

## Current denylist

| Package | Finding | Since | Sanctioned replacement |
| --- | --- | --- | --- |
| `react-native-send-intent` | F-12 (nested in the F-06 removal) | 2026-07 | `Linking.sendIntent(<ACTION>)` with an `openSettings()` fallback. See `src/hooks/useLocation.js` and `src/hooks/useLocationStatus.js` for the reference pattern. |

## Adding a new package to the denylist

Do this whenever an audit surfaces a native module that must not ship.

1. Uninstall the package if it's currently present:

   ```bash
   npm uninstall <package-name>
   ```

2. Add the entry to `scripts/security-denylist.js` in the `DENYLIST`
   array, including `name`, `finding`, `why`, and `replacement` fields.

3. Add the matching entry to `react-native.config.js` under
   `dependencies.<package-name>.platforms` with both `android: null`
   and `ios: null`.

4. Append a row to the "Current denylist" table above in this file.

5. Verify both layers fire:

   ```bash
   # Manually trigger Layer 1
   npm run security:denylist
   # Should say nothing and exit 0 (because package.json is clean).

   # Simulate a violation: temporarily add the banned package back
   # and confirm the install fails.
   ```

## Removing a package from the denylist

Do this only after a security review has concluded the risk is no
longer present (upstream library rewrote its bridge surface, or the
functionality is genuinely required and its risks are separately
mitigated).

1. Document the review conclusion in the commit that removes the
   entry — link to the review, and record the reviewer's name.

2. Remove the entry from BOTH `scripts/security-denylist.js` and
   `react-native.config.js`.

3. Remove the corresponding row from the "Current denylist" table.

4. If the package is being *re*-introduced, walk through the "adding
   a new native module" checklist below before running
   `npm install <package>`.

## Adding a new native module (allowlist review checklist)

For any *new* React Native native module the app pulls in, run this
review before merging the PR that adds it. Every "yes" needs an
explicit justification in the PR description.

- [ ] Does the package's `android/src/main/AndroidManifest.xml` declare
      any permissions the app doesn't already have? If yes, list them.
- [ ] Does the package expose bridge methods that read PII (phone,
      IMEI, IMSI, contacts, SMS, call log, location, sensor
      identifiers)?
- [ ] Does the package expose bridge methods that trigger side effects
      an attacker would want (place calls, send SMS, open URLs, take
      photos, record audio/video, capture screenshots)?
- [ ] Does the package register a `<provider>`, `<receiver>`, or
      `<service>` in its manifest? If yes, is it `exported="false"`?
- [ ] Is the package's GitHub actively maintained? What's the release
      cadence? Any open CVEs?
- [ ] Is there a Maven Central / OSSRH publication (i.e. is the AAR
      signed and hash-checkable), or does the build pull from Jitpack
      / a personal fork?
- [ ] Does the package's Java/Kotlin code pass a quick scan for
      `Runtime.exec`, `ProcessBuilder`, JNI `dlopen`, reflection into
      hidden Android APIs, or dynamic class loading?

Any red flags → deny by default, or restrict access via a wrapper
JS module that only exposes the safe subset.
