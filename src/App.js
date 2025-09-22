import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Route from './route'
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistStore} from 'redux-persist';
import {store,persistor} from './redux/store';

const App = () => {
  return (
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {/* <ErrorBoundary> */}
        <Route />
      {/* </ErrorBoundary> */}
    </PersistGate>
  </Provider>
  )
}

export default App

const styles = StyleSheet.create({})