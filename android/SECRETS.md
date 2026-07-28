# RKSK Secrets Handling

This document covers the runtime secrets the RKSK Android app needs — currently
the Google Maps / Google Routes API key — and satisfies the L1 audit finding
**F-08 — Google Maps API key hardcoded**. Read it before your first release
build, and before creating any new secret.

## What the audit flagged

| Location | Old value | Problem |
| --- | --- | --- |
| `android/app/src/main/AndroidManifest.xml` (`com.google.android.geo.API_KEY` meta-data) | `AIzaSyARAwP9SIAcyIFHdrrYbXA8a7EJe5nGV0o` | Hardcoded string, `git`-tracked. Also extractable from every released APK (`apktool d app.apk && grep AIza`). |
| `src/utils/constant/index.js` (`environment.GOOGLE_API_KEY`) | Same string | Same problem. |
| `src/screens/dashboard/tracking/index.js` | Same key used to call `routes.googleapis.com/directions/v2:computeRoutes` from the mobile client | **Architectural issue** — Google Routes API is a *server* API. Calling it from the client with a key means the key is inside the APK; even a properly restricted Android key can't restrict a server-only API to an Android app because the request has no Android caller identity for Google to check. |

## What has already been fixed in code

1. **`android/app/src/main/AndroidManifest.xml`** — the meta-data value is
   now `${GOOGLE_MAPS_API_KEY}`, an AGP manifest placeholder.
2. **`android/app/build.gradle`** — `defaultConfig.manifestPlaceholders`
   populates `GOOGLE_MAPS_API_KEY` from a Gradle property. If the property
   isn't set the placeholder resolves to a non-functional literal
   (`MISSING_GOOGLE_MAPS_API_KEY`) so debug builds still assemble; the
   `gradle.taskGraph.whenReady` guard fails the build loudly if a *release*
   task tries to run without a real key.
3. **`src/utils/constant/env.js`** (git-ignored) holds the JS-side secret.
   `src/utils/constant/env.example.js` (committed) is the template.
   `src/utils/constant/index.js` now imports from `./env` instead of
   inlining the key.
4. **`.gitignore`** — `src/utils/constant/env.js` and the usual `.env*`
   files are excluded from source control.

## What still needs to happen operationally

### 1. First-time / fresh-checkout setup

```bash
# JS-side secret
cp src/utils/constant/env.example.js src/utils/constant/env.js
# then edit env.js and fill in the real GOOGLE_API_KEY

# Android-side secret (per-user Gradle props)
cat >> ~/.gradle/gradle.properties <<'EOF'

# RKSK Google Maps SDK for Android (F-08). Restrict this key in Cloud Console
# to the Android package "com.rkskmp" + the release upload cert SHA-1.
GOOGLE_MAPS_API_KEY=AIza...replace-with-real-android-restricted-key
EOF
chmod 600 ~/.gradle/gradle.properties
```

On CI, expose `ORG_GRADLE_PROJECT_GOOGLE_MAPS_API_KEY` as an encrypted secret
and inject `src/utils/constant/env.js` at build time (e.g. copy from a
secret manager into the workspace before `assembleRelease`).

### 2. Rotate the leaked key immediately

`AIzaSyARAwP9SIAcyIFHdrrYbXA8a7EJe5nGV0o` was committed to `git` and shipped
inside every APK ever built. Treat it as public.

1. Open <https://console.cloud.google.com/apis/credentials>, select the RKSK
   project.
2. Find the leaked key. Click **Regenerate** (or **Delete** and create a new
   one — regenerate is faster because it preserves the API/application
   restrictions).
3. Update:
   - `~/.gradle/gradle.properties` on every dev machine.
   - `ORG_GRADLE_PROJECT_GOOGLE_MAPS_API_KEY` on CI.
   - `src/utils/constant/env.js` on every dev machine.
   - Any backend that uses the same key.
4. Watch <https://console.cloud.google.com/apis/dashboard> for the next 24 h
   for anomalous traffic from the old key — if attackers were scraping it
   from published APKs, you'll see the drop after regeneration.

### 3. Create one key per purpose, not one shared key

Sharing a single key across mobile SDK + server API is what turned the
"someone extracted our Maps key" problem into a "someone can also drain our
Routes API budget" problem. In the Cloud Console, create at least three
separate credentials:

| Credential | Application restriction | API restriction | Where it lives |
| --- | --- | --- | --- |
| `RKSK-Android-Maps` | Android apps → package `com.rkskmp` + release upload cert SHA-1 | Maps SDK for Android, Places SDK for Android (only what you actually call from the mobile SDK) | `GOOGLE_MAPS_API_KEY` in `~/.gradle/gradle.properties` / CI |
| `RKSK-iOS-Maps` | iOS apps → bundle identifier of the iOS app | Same set as Android | `ios/RKSK/Info.plist` (Info.plist injected the same way — separate story) |
| `RKSK-Backend-Routes` | IP addresses → your backend server's egress IPs | Routes API (**only**) | Backend server secret manager. **Never** in the mobile app. |

The SHA-1 for the Android restriction is the one from the upload keystore
you created in `SIGNING.md` — get it via:

```bash
keytool -list -v -keystore ~/keys/rksk-upload.keystore -storepass "$UPLOAD_STORE_PASS" \
  | grep SHA1
```

Paste both the debug key SHA-1 (from `~/.android/debug.keystore`, password
`android`) and the release upload key SHA-1 into the Cloud Console restriction.
If you later enrol in Play App Signing, add the Play-side app-signing SHA-1
too.

### 4. Move the Routes API call server-side

`src/screens/dashboard/tracking/index.js` currently hits
`https://routes.googleapis.com/directions/v2:computeRoutes` with a client-side
API key. Even a "restricted" Android key can't restrict a server API because
the request from the app carries no Android signing metadata that Google
would check on that endpoint. This means:

- **Anyone** who extracts `AIza…` from the APK can pound the Routes API
  and drain the RKSK Cloud billing budget until Cloud sets off an alert or
  cuts the key.
- Application-restrictions in the Cloud Console are cosmetic on this call.

The correct fix is a backend endpoint (e.g.
`POST https://rksk.nhmmp.gov.in/rkskapi/api/routes/compute`) that:

1. Authenticates the mobile user via the existing JWT.
2. Calls Google Routes API using `RKSK-Backend-Routes` (IP-restricted,
   Routes-only key held in a secret manager on the backend).
3. Returns the polyline + distance + duration to the mobile client.

Once that endpoint exists:

- Delete `envSecrets.GOOGLE_API_KEY` from `src/utils/constant/env.js` and
  `env.example.js`.
- Delete the `X-Goog-Api-Key` header and switch the `fetch` in
  `tracking/index.js` to the new backend endpoint.
- Delete the leaked key from the Cloud Console.

Until that happens, ship the tightest Cloud Console quotas you can tolerate
(e.g. 10 000 requests/day, 100/minute) to bound damage.

### 5. Verify a release APK does not contain the wrong key

After a release build:

```bash
strings android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
  | grep -E 'AIzaSy[A-Za-z0-9_-]{30,}'
```

Expected:

- Exactly one AIza-prefixed string appears (the current `GOOGLE_MAPS_API_KEY`
  for the Maps SDK). Confirm it matches what's in
  `~/.gradle/gradle.properties`.
- `MISSING_GOOGLE_MAPS_API_KEY` does **not** appear (would mean the
  placeholder leaked into a release — the build guard should have caught
  this earlier).
- No stray keys from `RKSK-Backend-Routes` or from other services.

Also verify the JS bundle:

```bash
apktool d -f -o /tmp/rksk-decoded android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
grep -a 'AIza' /tmp/rksk-decoded/assets/index.android.bundle
```

Same expectation: only the Routes-API key from `env.js` should appear
(until step 4 is done and it's removed altogether).

### 6. Adding a new secret in the future

- Add the key with a placeholder to `src/utils/constant/env.example.js`.
- Fill the real value into your local `env.js` (never commit).
- If the value is also needed on the Android side, add a new
  `manifestPlaceholders` entry in `android/app/build.gradle` and reference
  it in the manifest as `${YOUR_KEY_NAME}`, then load from
  `~/.gradle/gradle.properties` following the `GOOGLE_MAPS_API_KEY` pattern.
- Never introduce a new "AIza…" or similarly-formatted secret directly in a
  source file — if you see one in a code review, block the PR.
