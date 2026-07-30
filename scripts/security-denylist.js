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
 * Runs from the `postinstall` npm script so it catches:
 *
 *   - a fresh `npm ci` on CI,
 *   - `npm install <package>` on a dev machine,
 *   - a `git pull` that reintroduced a banned entry into package.json, and
 *   - a Dependabot PR that bumped `react-native` without also bumping
 *     the @react-native/* peers (Dependabot's grouped-updates config in
 *     .github/dependabot.yml is the belt; this check is the braces).
 *
 * The native-side denylist companion lives in `react-native.config.js`
 * under the `dependencies` block. Keep the two in sync — every entry
 * in DENYLIST here needs a matching entry there.
 *
 * See android/NATIVE_MODULES.md (F-12) and android/DEPENDENCIES.md
 * (F-16) for the rationale.
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

    if (denylistHits.length === 0 && rnDrift.length === 0) {
        // Silent success — keeps install output uncluttered.
        return;
    }

    // Report BOTH failure classes if both fire, then exit non-zero. This
    // avoids the "fix one, run install, discover the other" churn.
    if (denylistHits.length > 0) {
        reportDenylistHits(denylistHits);
    }
    if (rnDrift.length > 0) {
        reportRnDrift(rnDrift, stripRangePrefix(declared['react-native']));
    }

    process.exit(1);
}

main();
