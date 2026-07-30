# =============================================================================
# RKSK ProGuard / R8 rules — F-15 hardening
# =============================================================================
#
# Runs on the Java + Kotlin classpath of release builds only, downstream of:
#
#   1. proguard-android.txt
#        (AGP default — turns off some Android-framework false positives)
#   2. node_modules/react-native/ReactAndroid/proguard-rules.pro
#        (consumer rules from the react-android AAR; already keeps every
#         class implementing NativeModule / JavaScriptModule, every method
#         annotated with @ReactMethod / @ReactProp / @ReactPropGroup, every
#         @DoNotStrip class/member, Yoga bindings, and Hermes JNI.)
#   3. node_modules/react-native-reanimated/android/proguard-rules.pro
#   4. node_modules/react-native-worklets/android/proguard-rules.pro
#        (both consumed via AAR metadata; keep the JSI/worklets bridges.)
#   5. This file.
#
# So the ONLY rules that belong here are:
#   - app-specific classes touched by reflection / JS bridge that the RN
#     blanket rules don't already cover
#   - defensive rules for third-party libraries this app uses that do NOT
#     ship consumer rules of their own
#   - stack-trace / obfuscation-map hygiene tweaks
#   - explicit -assumenosideeffects blocks that let R8 delete log calls
#     from the release bytecode
#
# Adding a rule? Follow the recipe:
#   1. Rebuild release. Verify the app boots past login on a fresh install.
#   2. If a NoClassDefFoundError / ClassNotFoundException fires at runtime,
#      grep `android/app/build/outputs/mapping/release/mapping.txt` for the
#      original symbol; add the narrowest possible -keep that covers it.
#   3. Add a one-line comment above the -keep explaining WHY (which library,
#      which reflection call, which crash you reproduced). Never add a
#      blanket `-keep class ** { *; }`.
#   4. Reference android/OBFUSCATION.md §5 for the full triage flow.
# =============================================================================


# -----------------------------------------------------------------------------
# 1. Attribute preservation
# -----------------------------------------------------------------------------
# Annotations must survive so RN's own -keep-annotated rules keep matching,
# so retrofit-style libraries stay reflection-safe, and so kotlin.Metadata is
# available to any Kotlin reflection consumer at runtime.
-keepattributes *Annotation*
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeVisibleTypeAnnotations
-keepattributes AnnotationDefault
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes Signature
-keepattributes Exceptions
-keepattributes SourceFile,LineNumberTable

# Rename SourceFile to a constant string so stack traces stop leaking the
# original .kt / .java filename. LineNumberTable is preserved above so
# crashes still de-obfuscate cleanly against mapping.txt.
-renamesourcefileattribute SourceFile


# -----------------------------------------------------------------------------
# 2. Kotlin runtime
# -----------------------------------------------------------------------------
# RN 0.81's MainActivity / MainApplication template is Kotlin. Kotlin's
# reflection reads Metadata off classes; without this R8 renames the
# metadata blob and reflection dies. `dontwarn` blocks silence the false
# positives R8 emits when Kotlin stdlib references JVM 9+ classes not
# present on Android.
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**
-dontwarn kotlin.reflect.**
-dontwarn java.lang.invoke.**


# -----------------------------------------------------------------------------
# 3. Android application / activity entry points
# -----------------------------------------------------------------------------
# AGP auto-keeps classes referenced from AndroidManifest.xml, so
# MainActivity and MainApplication are already safe. These broader keeps
# guard against future subclasses added to the manifest via manifest merger
# from an autolinked library.
-keep public class * extends android.app.Application
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Explicitly keep the app's manifest-referenced entry classes. Redundant
# with the above but documents intent, and survives if the manifest ever
# starts using a non-standard `android:name` pattern.
-keep public class com.rkskmp.MainActivity { *; }
-keep public class com.rkskmp.MainApplication { *; }
-keep public class com.rkskmp.BuildConfig { *; }


# -----------------------------------------------------------------------------
# 4. React Native reinforcement
# -----------------------------------------------------------------------------
# react-android's own consumer rules cover most of these, but they use
# `-keep,includedescriptorclasses` which R8 has been observed to weaken
# under aggressive `-repackageclasses` / `-flattenpackagehierarchy` (both
# implicit in AGP's default R8 config). Re-declaring the strictest form
# here makes the intent explicit and future-proof.
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**


# -----------------------------------------------------------------------------
# 5. New Architecture (Fabric + TurboModules) — newArchEnabled=true
# -----------------------------------------------------------------------------
# Codegen writes generated NativeModule spec classes into
# `android/app/build/generated/source/codegen/java/...` and the JS layer
# looks them up by their generated names. Keep the whole codegen namespace
# so R8 can't rename any of them.
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * implements com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }
-keepclassmembers,includedescriptorclasses class * {
    native <methods>;
}


# -----------------------------------------------------------------------------
# 6. JavaScript-callable interfaces (WebView bridge, JSI, etc.)
# -----------------------------------------------------------------------------
# react-native-webview builds an `injectedJavaScript` bridge through
# `RNCWebView.injectJavaScript(String)`. Any method annotated with
# @JavascriptInterface on any class must survive to keep that bridge alive.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}


# -----------------------------------------------------------------------------
# 7. Reflection-heavy third-party libraries used by the app
# -----------------------------------------------------------------------------

# react-native-maps + Google Play Services (Google Maps SDK, Location,
# GmsCore auth). Play Services uses reflection extensively for its plugin
# loader and its `SafeParcelable` framework.
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.android.libraries.** { *; }
-dontwarn com.google.android.libraries.**

# react-native-video / react-native-thumbnail-video — ExoPlayer under the
# hood, whose renderer factories are looked up by reflection at startup.
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# react-native-pdf renders via `com.github.barteksc.pdfviewer.PDFView` +
# the bundled pdfium native lib. The pdfium wrapper resolves callback
# handler classes by name; keep the whole namespace to be safe (small
# module, negligible size).
-keep class com.github.barteksc.pdfviewer.** { *; }
-keep class com.shockwave.** { *; }
-dontwarn com.github.barteksc.**

# react-native-vector-icons registers icon families through a JSON-driven
# assets map. Icon TypeFace loading uses Class.forName(...) internally on
# older versions of the library.
-keep class com.oblador.vectoricons.** { *; }
-dontwarn com.oblador.vectoricons.**

# OkHttp + Okio (bundled transitively via axios/fetch → OkHttp on Android).
# The RN consumer rules cover the core surface; these `dontwarn` blocks
# suppress the false positives for optional TLS providers not on Android.
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**


# -----------------------------------------------------------------------------
# 8. F-15 / F-05 defense-in-depth: strip native log calls from release
# -----------------------------------------------------------------------------
# On the JS side, `babel-plugin-transform-remove-console` (F-05) + Terser
# `compress.drop_console: true` (F-15, metro.config.js) between them wipe
# every `console.*` from the Hermes bundle.
#
# On the JAVA/Kotlin side, native modules (jail-monkey, keychain, blob-util
# etc.) still ship compiled `android.util.Log.d(...)` calls that would
# otherwise emit PII to logcat in production. `-assumenosideeffects`
# tells R8 that a call to any of these Log methods has no observable
# effect, so R8 is free to delete the entire call site — including the
# String concatenation building the log message.
#
# Log.wtf() is INTENTIONALLY not listed: it signals an assertion the
# author considered fatal, and swallowing those silently would mask real
# crashes.
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int d(...);
    public static int w(...);
    public static int e(...);
}


# -----------------------------------------------------------------------------
# 9. Debug-diagnosis hooks (leave commented in normal builds)
# -----------------------------------------------------------------------------
# If a release build post-R8 mystery-crashes on startup, temporarily
# UNCOMMENT ONE of the two lines below, rebuild, capture the stack, then
# re-comment before shipping. Do NOT ship with either enabled:
#
#   `-dontobfuscate`  — turns off renaming (keeps class names intact so
#                       the crash is directly diagnosable). Trades away
#                       the F-15 fix for readability.
#
#   `-dontoptimize`   — turns off code motion / inlining (rules out
#                       optimization bugs as the cause). Safer than
#                       -dontobfuscate for keeping the F-15 posture.
#
# -dontobfuscate
# -dontoptimize
