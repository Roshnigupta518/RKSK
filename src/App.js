import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import Route from './route'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { store, persistor } from './redux/store';
import ErrorBoundary from './components/errorBoundry';
import { reStartBackgroundService } from './utils/bgservices/backgroundService';
import useNetworkStatus from './hooks/networkStatus';
import { syncTaskName } from './utils/bgservices/backgroundTaskEnum';

const App = () => {

  const isConnected = useNetworkStatus();

  const startSync = () => {
    if (isConnected) {
      reStartBackgroundService(syncTaskName.all);
    }
  };

  useEffect(() => {
    startSync();
  }, [isConnected]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          <Route />
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  )
}

export default App

const styles = StyleSheet.create({})