package com.rkskmp

import android.app.Application
import android.webkit.WebView
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    // -----------------------------------------------------------------------
    // F-26 hardening — WebView remote-debugging force-disable.
    //
    // android.webkit.WebView.setWebContentsDebuggingEnabled() is a STATIC
    // method: once any code invokes it with `true`, chrome://inspect can
    // attach to every WebView in this process for the rest of the process
    // lifetime (DOM inspection, JS console, network traffic, localStorage,
    // cookies). RKSK renders authenticated app content (JWT-protected
    // dashboards, PII forms, health-worker workflows) inside RN components
    // that share the process with WebViews spun up by react-native-webview
    // (transitively via react-native-youtube-iframe), so a "true" call here
    // is effectively a full-session hijack primitive on any device with
    // USB debugging on.
    //
    // Layer 2 of the F-26 defence: we call setWebContentsDebuggingEnabled(false)
    // at Application.onCreate() BEFORE loadReactNative() spins up the JS
    // context / any RNCWebView is materialised. This is a runtime guarantee
    // that the process starts in the "debugging disabled" state on release
    // builds regardless of what the linked react-android AAR variant baked
    // into ReactBuildConfig.DEBUG happens to be.
    //
    // Layer 1 (the patch on RNCWebViewManagerImpl.kt shipped via
    // patches/react-native-webview+13.16.1.patch) additionally prevents the
    // library from calling setWebContentsDebuggingEnabled(true) at WebView
    // instantiation time and turns the JS-controllable webviewDebuggingEnabled
    // prop into a no-op in release builds — so no later code path can undo
    // this reset.
    //
    // On debug builds we intentionally do NOTHING here so that
    // chrome://inspect keeps working for developers.
    //
    // See android/WEBVIEW_DEBUGGING.md for the full threat model, layer
    // diagram, and verification steps.
    // -----------------------------------------------------------------------
    if (!BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(false)
    }

    loadReactNative(this)
  }
}
