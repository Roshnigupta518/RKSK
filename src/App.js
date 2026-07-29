import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import Route from './route';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import ErrorBoundary from './components/errorBoundry';
import { reStartBackgroundService } from './utils/bgservices/backgroundService';
import useNetworkStatus from './hooks/networkStatus';
import { syncTaskName } from './utils/bgservices/backgroundTaskEnum';
import { bootstrapSecurity, IntegrityService } from './utils/security';

const App = () => {
  const isConnected = useNetworkStatus();
  const [securityReady, setSecurityReady] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [integrityVerdict, setIntegrityVerdict] = useState(null);
  const [integrityAcknowledged, setIntegrityAcknowledged] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // F-04: hydrate Keychain-backed secrets BEFORE the redux store is touched
  // for the first time. The store module exposes lazy proxies; the first
  // property access triggers construction, which requires the persist
  // encryption key to already be resident in EncryptionKeyService. If we
  // let <Provider> mount before bootstrap resolves, the transform build
  // would throw.
  //
  // F-13: integrity checks are hydrated as part of the same bootstrap
  // step (see src/utils/security/bootstrap.js). We surface the cached
  // verdict here so we can gate rendering on it before the redux store
  // is instantiated — this ensures no PII ever reaches a compromised
  // device's Redux state.
  useEffect(() => {
    let cancelled = false;
    setSecurityError(null);
    setIntegrityVerdict(null);
    setIntegrityAcknowledged(false);
    IntegrityService.reset();
    bootstrapSecurity()
      .then(() => {
        if (cancelled) return;
        setIntegrityVerdict(IntegrityService.getVerdict());
        setSecurityReady(true);
      })
      .catch((err) => {
        console.warn('[security] bootstrap failed:', err?.message || err);
        if (!cancelled) setSecurityError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (isConnected && securityReady) {
      reStartBackgroundService(syncTaskName.all);
    }
  }, [isConnected, securityReady]);

  const handleRetry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  const handleIntegrityAcknowledge = useCallback(() => {
    setIntegrityAcknowledged(true);
  }, []);

  if (securityError) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Secure storage unavailable</Text>
        <Text style={styles.fallbackText}>
          The app could not initialise its secure storage on this device.
          Please retry, or restart the app if this keeps happening.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!securityReady) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // F-13: integrity gate. `block` means we detected a security-critical
  // condition (rooted device, hook framework, external-storage install,
  // debugger in a release build) — do NOT render the app or expose the
  // redux store. `warn` surfaces to the user but they can continue.
  // `ok` renders normally.
  if (integrityVerdict && integrityVerdict.riskLevel === 'block') {
    return (
      <IntegritySplash
        verdict={integrityVerdict}
        variant="block"
        onRetry={handleRetry}
      />
    );
  }
  if (
    integrityVerdict &&
    integrityVerdict.riskLevel === 'warn' &&
    !integrityAcknowledged
  ) {
    return (
      <IntegritySplash
        verdict={integrityVerdict}
        variant="warn"
        onContinue={handleIntegrityAcknowledge}
      />
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          <Route />
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
};

const INTEGRITY_REASON_MESSAGES = {
  hook_framework_detected:
    'A dynamic instrumentation tool (Frida / Xposed / Substrate) is running on this device.',
  app_running_from_external_storage:
    'The app is installed on external storage (SD card). This is not a supported configuration.',
  rooted_device:
    'This device is rooted. Handling health data on a rooted device is not permitted.',
  debugger_attached:
    'A debugger is attached to the app process.',
  running_on_emulator:
    'The app is running on an Android emulator.',
  adb_enabled_on_release:
    'Android Debug Bridge (USB debugging) is enabled on this device.',
  developer_options_enabled:
    'Developer options are enabled on this device.',
  mock_location_capable:
    'This device is configured to allow mock GPS locations.',
  sideloaded_install:
    'The app was installed from an unknown source instead of the Play Store or a recognised OEM store.',
};

const IntegritySplash = ({ verdict, variant, onContinue, onRetry }) => {
  const isBlock = variant === 'block';
  return (
    <View style={styles.integrityFallback}>
      <ScrollView contentContainerStyle={styles.integrityScroll}>
        <Text style={styles.integrityTitle}>
          {isBlock ? 'Cannot run on this device' : 'Security warning'}
        </Text>
        <Text style={styles.integrityBody}>
          {isBlock
            ? 'The RKSK app cannot start because this device is in a state that would put health-record data at risk. If you believe this is a mistake, please contact your program administrator.'
            : 'The RKSK app has detected that this device is configured in a way that reduces the security of health-record data. You may continue, but this session will be logged.'}
        </Text>
        {verdict?.reasons?.length ? (
          <View style={styles.reasonList}>
            {verdict.reasons.map((r) => (
              <Text style={styles.reasonItem} key={r}>
                • {INTEGRITY_REASON_MESSAGES[r] || r}
              </Text>
            ))}
          </View>
        ) : null}
        {isBlock ? (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry check</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.retryButton} onPress={onContinue}>
            <Text style={styles.retryText}>I understand, continue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#413DFB',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  integrityFallback: {
    flex: 1,
    backgroundColor: '#fff',
  },
  integrityScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  integrityTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#B00020',
  },
  integrityBody: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    color: '#333',
  },
  reasonList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  reasonItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    color: '#333',
  },
});
