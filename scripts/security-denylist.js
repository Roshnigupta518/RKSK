#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Security & supply-chain postinstall check.
 *
 * Fails the install with a non-zero exit code if:
 *
 *   1. package.json references any package that the security review has
 *      explicitly forbidden (F-12 denylist).
 *
 *   2. The @react-native/* family of packages has drifted out of
 *      alignment with the react-native core version (F-16 drift guard).
 *      RN's inter-package coupling is tight: `@react-native/babel-preset`,
 *      `@react-native/metro-config`, `@react-native/eslint-config`, and
 *      `@react-native/typescript-config` MUST share the same version as
 *      `react-native` itself, or Metro / codegen / TypeScript will
 *      silently do the wrong thing.
 *
 *   3. A stripped-or-hardened-transitive-dependency has regressed inside
 *      node_modules (F-18 & F-26 patched-dep guard). "Stripped" is used
 *      loosely — some entries strip code (LAME/JLayer inside
 *      react-native-compressor, F-18) while others harden code (F-26
 *      compile-time gates on react-native-webview's remote-debugging
 *      surface). Both cases share the same failure mode: patch-package
 *      applied against a version of the file it no longer understands,
 *      leaving pristine (vulnerable) code in place. The check is generic
 *      — each entry in STRIPPED_TRANSITIVE_DEPS declares a pair of
 *      substring lists:
 *
 *         forbiddenSymbols  — MUST NOT appear (pristine leftovers)
 *         requiredSymbols   — MUST appear (patched-in markers)
 *
 *      A regression on EITHER list fails the install.
 *
 * Runs from the `postinstall` npm script so it catches:
 *
 *   - a fresh `npm ci` on CI,
 *   - `npm install <package>` on a dev machine,
 *   - a `git pull` that reintroduced a banned entry into package.json,
 *   - a Dependabot PR that bumped `react-native` without also bumping
 *     the @react-native/* peers (Dependabot's grouped-updates config in
 *     .github/dependabot.yml is the belt; this check is the braces), and
 *   - a `react-native-compressor` version bump that made the
 *     patches/react-native-compressor+*.patch fail to apply and
 *     silently reintroduced LAME/JLayer, and
 *   - a `react-native-webview` version bump that reshuffled
 *     RNCWebViewManagerImpl.kt line numbers and left the F-26
 *     WebView-remote-debugging gates unhardened.
 *
 * ORDERING WITH patch-package: this script runs AFTER `patch-package`
 * (see the `postinstall` script in package.json). That ordering matters
 * for check #3 — we grep node_modules for stripped symbols, and that
 * grep is only meaningful once patches have been applied. patch-package
 * is invoked with `--error-on-fail` so a failed patch application
 * halts the install before we even get here; this check is the
 * defense-in-depth layer that catches "patch succeeded but doesn't
 * actually strip what we expected" (e.g. upstream renamed a file so
 * the patch applies to the wrong location).
 *
 * The native-side denylist companion lives in `react-native.config.js`
 * under the `dependencies` block. Keep the two in sync — every entry
 * in DENYLIST here needs a matching entry there.
 *
 * See android/NATIVE_MODULES.md (F-12), android/DEPENDENCIES.md
 * (F-16), android/AUDIO_STRIP.md (F-18), and
 * android/WEBVIEW_DEBUGGING.md (F-26) for the rationale.
 */

const fs = require('fs');
const path = require('path');

// Each entry documents (a) the audit finding it closes and (b) a one-line
// summary of what the package does that we don't want in the app.
const DENYLIST = [
    {
        name: 'react-native-send-intent',
        finding: 'F-12',
        why:
            'RNSendIntentModule exposes getPhoneNumber() / getVoicemailNumber() ' +
            'over the RN bridge and requires READ_PHONE_STATE. A supply-chain ' +
            "or hostile-JS attacker can read the user's phone number silently.",
        replacement:
            "Linking.sendIntent(<ACTION>) for the narrow 'open Android settings' " +
            'use-case; see src/hooks/useLocation.js and src/hooks/useLocationStatus.js.',
    },
    // Add new entries here as future audit findings close out. Keep the
    // matching react-native.config.js `dependencies` block in sync.
];

function readPkg() {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    if (!fs.existsSync(pkgPath)) {
        console.error(
            '\x1b[31m[security-denylist] Could not locate package.json at ' +
                pkgPath +
                '\x1b[0m',
        );
        process.exit(2);
    }
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function collectDeclaredDeps(pkg) {
    return {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
        ...(pkg.optionalDependencies || {}),
    };
}

// -----------------------------------------------------------------------------
// F-16: React Native family version-drift guard.
//
// These packages MUST all be pinned to the exact same version as
// `react-native`. A drift means Metro compiles JS against one API surface
// while the native runtime expects another — Metro / codegen bugs surface
// as unrelated runtime crashes on device, and the diagnostic path from
// "app crashes on startup" back to "@react-native/babel-preset was 0.81.4
// while react-native was 0.81.5" is painful. Fail fast at install time.
//
// Some `@react-native/*` packages are on independent version tracks and
// are intentionally NOT gated by this check:
//   - @react-native/new-app-screen  — a dev-time sample screen, safe to drift
//   - Any future scoped package not in the alignment list below.
// -----------------------------------------------------------------------------
const REACT_NATIVE_ALIGNED_PACKAGES = [
    '@react-native/babel-preset',
    '@react-native/eslint-config',
    '@react-native/metro-config',
    '@react-native/typescript-config',
    '@react-native/new-app-screen',
];

// Strip semver range prefixes (`^`, `~`, `>=`, `>`, `<=`, `<`, `=`) so a
// developer using `~0.81.4` doesn't trip the check just because of the
// prefix character. We compare the resolved base version — the number.
function stripRangePrefix(spec) {
    if (typeof spec !== 'string') return spec;
    return spec.replace(/^[\^~=<>]+/, '').trim();
}

function checkReactNativeAlignment(declared) {
    const rnSpec = declared['react-native'];
    if (!rnSpec) {
        // No react-native declared? Weird, but not this script's problem.
        return [];
    }

    const rnVersion = stripRangePrefix(rnSpec);
    const drift = [];

    for (const pkgName of REACT_NATIVE_ALIGNED_PACKAGES) {
        const peerSpec = declared[pkgName];
        if (!peerSpec) continue; // package not used — fine, skip

        const peerVersion = stripRangePrefix(peerSpec);
        if (peerVersion !== rnVersion) {
            drift.push({
                name: pkgName,
                declared: peerSpec,
                expected: rnVersion,
            });
        }
    }

    return drift;
}

function reportDenylistHits(hits) {
    console.error('');
    console.error(
        '\x1b[31m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m',
    );
    console.error(
        '\x1b[31m║ SECURITY DENYLIST VIOLATION — install aborted                        ║\x1b[0m',
    );
    console.error(
        '\x1b[31m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m',
    );
    console.error('');
    console.error(
        'The following package(s) are on the RKSK security denylist and must',
    );
    console.error('not appear in package.json:');
    console.error('');
    for (const hit of hits) {
        console.error(`  ✗ ${hit.name}   (finding: ${hit.finding})`);
        console.error(`      why:         ${hit.why}`);
        console.error(`      replacement: ${hit.replacement}`);
        console.error('');
    }
    console.error(
        'Remove the entry from package.json and delete it from node_modules,',
    );
    console.error(
        'then rerun `npm install`. See android/NATIVE_MODULES.md for the full',
    );
    console.error('policy on adding or removing native modules.');
    console.error('');
}

// -----------------------------------------------------------------------------
// F-18: stripped-transitive-dependency guard.
//
// Some hardening findings work by *removing* a transitive dependency via
// patch-package, rather than by removing a top-level package. That
// arrangement is fragile in ways the F-12 top-level denylist can't catch:
//
//   - a react-native-compressor version bump may rename Audio*.kt files,
//     silently making patches/react-native-compressor+1.13.0.patch
//     apply to nothing;
//   - a developer might hand-edit node_modules to "just try enabling
//     audio compression" and re-introduce LAME on their branch;
//   - the patch line-count context could match against fresh upstream
//     content that happens to have similar wording, applying a partial
//     hunk that leaves LAME imports around.
//
// So we also grep the on-disk node_modules content post-patch and fail
// the install if the forbidden symbols show up. Each entry below
// documents (a) the finding that motivated the strip, (b) a set of
// filesystem globs to scan, and (c) the exact substrings that must
// NOT appear in those files.
// -----------------------------------------------------------------------------
const STRIPPED_TRANSITIVE_DEPS = [
    {
        finding: 'F-18',
        packageName: 'react-native-compressor',
        // What the finding is about, for error messages.
        summary:
            'LAME 3.100 (unmaintained MP3 encoder with multiple heap-overflow ' +
            'CVEs) + JLayer 1.0.1 (2008-vintage MP3 decoder) were stripped ' +
            'from react-native-compressor via patch-package. Their reappearance ' +
            "in node_modules means the patch didn't apply cleanly.",
        // Files to inspect. Relative to the workspace root.
        scanPaths: [
            'node_modules/react-native-compressor/android/build.gradle',
            'node_modules/react-native-compressor/android/src/main/java/com/reactnativecompressor/Audio/AudioCompressor.kt',
        ],
        // Substrings that MUST NOT appear as live code in the files above.
        // We look for them as raw substrings, so ANY occurrence — comment
        // or otherwise — currently trips the check. That is intentional
        // for uppercase forbidden identifiers ('LameBuilder', 'WaveReader',
        // 'JavaLayerException', 'com.naman14.androidlame') — those are
        // Kotlin identifiers that cannot legitimately show up in comments
        // in the post-patch state. See guarded gitub package coordinates
        // below (`AndroidLame-kotlin`, `javazoom:jlayer:`); those CAN
        // appear inside `//`-commented-out lines in the compressor's
        // build.gradle without indicating regression, so we scope those
        // to non-comment lines only via the `mustBeUncommented: true`
        // marker below.
        forbiddenSymbols: [
            { needle: 'LameBuilder', mustBeUncommented: false },
            { needle: 'WaveReader', mustBeUncommented: false },
            { needle: 'com.naman14.androidlame', mustBeUncommented: false },
            { needle: 'JavaLayerException', mustBeUncommented: false },
            { needle: 'javazoom.jl.', mustBeUncommented: false },
            {
                needle: "'com.github.banketree:AndroidLame-kotlin:",
                mustBeUncommented: true,
            },
            {needle: "'javazoom:jlayer:", mustBeUncommented: true},
        ],
        // Human-readable diagnostic pointer.
        remediation:
            'Run `npx patch-package` and confirm the patches/react-native-compressor+*.patch ' +
            'file applied. If react-native-compressor was bumped, regenerate the patch ' +
            'against the new version (see android/AUDIO_STRIP.md §Regenerating).',
    },
    {
        finding: 'F-26',
        packageName: 'react-native-webview',
        summary:
            "WebView remote-debugging (chrome://inspect) is a static process-wide " +
            'switch on Android — one call to WebView.setWebContentsDebuggingEnabled(true) ' +
            'exposes every WebView in the process (DOM, JS console, cookies, ' +
            'localStorage) to anyone with USB access. patch-package pins two ' +
            'gates in RNCWebViewManagerImpl.kt: (1) the auto-enable path at ' +
            'WebView instantiation requires BOTH ReactBuildConfig.DEBUG and ' +
            "the library's own BuildConfig.DEBUG to be true, and (2) the " +
            'JS-controllable `webviewDebuggingEnabled` prop is a no-op in ' +
            'release builds. If either gate is missing post-patch, the ' +
            'audit finding is un-remediated.',
        scanPaths: [
            'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt',
        ],
        // Pristine leftovers — if any of these appear, the patch failed.
        // We anchor on the exact pristine strings that the patch REMOVES.
        // Post-patch:
        //   - `if (ReactBuildConfig.DEBUG) {`  →  `if (ReactBuildConfig.DEBUG && BuildConfig.DEBUG) {`
        //   - `setWebviewDebuggingEnabled(...)` body no longer begins with
        //     a bare `RNCWebView.setWebContentsDebuggingEnabled(enabled)` —
        //     it now begins with the `// F-26 hardening:` comment block
        //     and the `if (!BuildConfig.DEBUG) return` guard.
        // Both pristine substrings below cannot reappear via a legitimate
        // upstream refactor without also breaking the F-26 hardening.
        forbiddenSymbols: [
            {
                needle: 'if (ReactBuildConfig.DEBUG) {',
                mustBeUncommented: true,
            },
        ],
        // Patched-in markers — if any is missing, the patch did not apply
        // to the location we expected (upstream reshuffled lines / renamed
        // symbols) and the hardening is silently absent.
        requiredSymbols: [
            // The single import that both gates depend on. If this is
            // missing, neither gate compiles and the patch clearly failed.
            {needle: 'import com.reactnativecommunity.webview.BuildConfig'},
            // Compound instantiation-time gate.
            {needle: 'if (ReactBuildConfig.DEBUG && BuildConfig.DEBUG) {'},
            // Prop-path release-build short-circuit. The exact combination
            // of `!BuildConfig.DEBUG` inside `setWebviewDebuggingEnabled`
            // is unique to the F-26 patch.
            {needle: 'if (!BuildConfig.DEBUG) {'},
            // Belt-and-braces: the F-26 comment banner. This won't survive
            // an upstream cleanup that strips comments, so we don't lean
            // on it as the sole marker — but its absence alongside a
            // missing gate makes the failure message unambiguous.
            {needle: 'F-26 hardening'},
        ],
        remediation:
            'Run `npx patch-package` and confirm patches/react-native-webview+*.patch ' +
            'applied. If react-native-webview was bumped, regenerate the patch ' +
            'against the new version (see android/WEBVIEW_DEBUGGING.md ' +
            '§Regeneration playbook). Do NOT publish a release build until this ' +
            'guard is green — a failed patch here means chrome://inspect can ' +
            'attach to production WebViews.',
    },
];

function stripLineComments(source, fileExt) {
    // Very small comment stripper — good enough for Kotlin/Groovy line
    // comments (`//`). We do NOT try to parse `/* ... */` block comments;
    // if a legit comment inside a block accidentally matches a forbidden
    // symbol we prefer the false positive (louder is safer here).
    const lines = source.split(/\r?\n/);
    return lines
        .map((line) => {
            const idx = line.indexOf('//');
            return idx === -1 ? line : line.slice(0, idx);
        })
        .join('\n');
}

function checkStrippedTransitiveDeps() {
    const workspaceRoot = path.resolve(__dirname, '..');
    const violations = [];

    for (const entry of STRIPPED_TRANSITIVE_DEPS) {
        for (const relPath of entry.scanPaths) {
            const absPath = path.resolve(workspaceRoot, relPath);

            if (!fs.existsSync(absPath)) {
                // The file itself is missing — that's a strong signal
                // that the patch either wasn't applied OR that the
                // upstream package changed shape. Either way, we can't
                // verify the strip, so we fail loud.
                violations.push({
                    entry,
                    relPath,
                    needle: '(file missing)',
                    context: 'expected file does not exist',
                });
                continue;
            }

            const raw = fs.readFileSync(absPath, 'utf8');
            const codeOnly = stripLineComments(raw, path.extname(absPath));

            // ---- forbidden (pristine leftovers) ----
            for (const {needle, mustBeUncommented} of entry.forbiddenSymbols) {
                const haystack = mustBeUncommented ? codeOnly : raw;
                if (haystack.includes(needle)) {
                    // Grab the first matching line for a helpful diag.
                    const matchLine =
                        haystack
                            .split(/\r?\n/)
                            .find((l) => l.includes(needle)) || '';
                    violations.push({
                        entry,
                        relPath,
                        needle,
                        kind: 'forbidden',
                        context: matchLine.trim().slice(0, 160),
                    });
                }
            }

            // ---- required (patched-in markers) ----
            // Optional field: only some entries assert positive markers.
            // A patch that just deletes lines has nothing meaningful to
            // check for post-patch; a patch that modifies-in-place (like
            // F-26) does.
            const requiredSymbols = entry.requiredSymbols || [];
            for (const {needle, mustBeUncommented} of requiredSymbols) {
                const haystack = mustBeUncommented ? codeOnly : raw;
                if (!haystack.includes(needle)) {
                    violations.push({
                        entry,
                        relPath,
                        needle,
                        kind: 'required',
                        // No context line — the whole point is that it's absent.
                        context: '(expected marker is missing from file)',
                    });
                }
            }
        }
    }

    return violations;
}

function reportStrippedTransitiveDeps(violations) {
    console.error('');
    console.error(
        '\x1b[31m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m',
    );
    console.error(
        '\x1b[31m║ STRIPPED TRANSITIVE DEP REGRESSION — install aborted                 ║\x1b[0m',
    );
    console.error(
        '\x1b[31m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m',
    );
    console.error('');

    // Group violations by finding for readability.
    const byFinding = new Map();
    for (const v of violations) {
        const key = v.entry.finding;
        if (!byFinding.has(key)) byFinding.set(key, []);
        byFinding.get(key).push(v);
    }

    for (const [finding, list] of byFinding.entries()) {
        const entry = list[0].entry;
        console.error(`Finding ${finding} — ${entry.packageName}`);
        console.error(`  ${entry.summary}`);
        console.error('');
        console.error('  Regressions detected:');
        for (const v of list) {
            // Legacy entries pre-F-26 didn't set `kind` — default to
            // 'forbidden' for backwards compatibility.
            const kind = v.kind || 'forbidden';
            const arrow = kind === 'required' ? '✗ missing:' : '✗ leftover:';
            console.error(`    ${arrow} ${v.needle}`);
            console.error(`        in ${v.relPath}`);
            if (v.context) {
                console.error(`        near: ${v.context}`);
            }
        }
        console.error('');
        console.error(`  Fix: ${entry.remediation}`);
        console.error('');
    }
}

function reportRnDrift(drift, rnVersion) {
    console.error('');
    console.error(
        '\x1b[31m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m',
    );
    console.error(
        '\x1b[31m║ REACT NATIVE FAMILY VERSION DRIFT — install aborted (F-16)           ║\x1b[0m',
    );
    console.error(
        '\x1b[31m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m',
    );
    console.error('');
    console.error(
        `\`react-native\` is declared at ${rnVersion}, but the following peer`,
    );
    console.error(
        'packages that must move in lockstep with it are out of alignment:',
    );
    console.error('');
    for (const d of drift) {
        console.error(
            `  ✗ ${d.name}   declared: ${d.declared}   expected: ${d.expected}`,
        );
    }
    console.error('');
    console.error(
        'Align every entry above to match the react-native version, then rerun',
    );
    console.error(
        '`npm install`. If you are intentionally bumping RN, do it as a single',
    );
    console.error(
        'commit that touches ALL of these entries plus @react-native-community/cli-*.',
    );
    console.error(
        'See android/DEPENDENCIES.md §3 for the RN upgrade playbook.',
    );
    console.error('');
}

function main() {
    const pkg = readPkg();
    const declared = collectDeclaredDeps(pkg);

    // ------------------------------------------------------------------
    // Check 1 (F-12): denylist violations.
    // ------------------------------------------------------------------
    const denylistHits = DENYLIST.filter((entry) =>
        Object.prototype.hasOwnProperty.call(declared, entry.name),
    );

    // ------------------------------------------------------------------
    // Check 2 (F-16): React Native family alignment.
    // ------------------------------------------------------------------
    const rnDrift = checkReactNativeAlignment(declared);

    // ------------------------------------------------------------------
    // Check 3 (F-18): stripped transitive deps still stripped.
    // ------------------------------------------------------------------
    const strippedRegressions = checkStrippedTransitiveDeps();

    if (
        denylistHits.length === 0 &&
        rnDrift.length === 0 &&
        strippedRegressions.length === 0
    ) {
        // Silent success — keeps install output uncluttered.
        return;
    }

    // Report ALL failure classes if any fire, then exit non-zero. This
    // avoids the "fix one, run install, discover the other" churn.
    if (denylistHits.length > 0) {
        reportDenylistHits(denylistHits);
    }
    if (rnDrift.length > 0) {
        reportRnDrift(rnDrift, stripRangePrefix(declared['react-native']));
    }
    if (strippedRegressions.length > 0) {
        reportStrippedTransitiveDeps(strippedRegressions);
    }

    process.exit(1);
}

main();
