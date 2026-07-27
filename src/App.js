import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
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
import { bootstrapSecurity } from './utils/security';

const App = () => {
  const isConnected = useNetworkStatus();
  const [securityReady, setSecurityReady] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // F-04: hydrate Keychain-backed secrets BEFORE the redux store is touched
  // for the first time. The store module exposes lazy proxies; the first
  // property access triggers construction, which requires the persist
  // encryption key to already be resident in EncryptionKeyService. If we
  // let <Provider> mount before bootstrap resolves, the transform build
  // would throw.
  useEffect(() => {
    let cancelled = false;
    setSecurityError(null);
    bootstrapSecurity()
      .then(() => {
        if (!cancelled) setSecurityReady(true);
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
});
