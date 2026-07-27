/**
 * @format
 */
// F-04 fix: polyfill global crypto.getRandomValues BEFORE anything else runs.
// redux-persist-transform-encrypt uses crypto-js internally, and crypto-js
// needs a CSPRNG to generate the AES IV on every encrypt call. Hermes does
// not ship crypto.getRandomValues by default; without this polyfill each
// persisted redux write throws "Native crypto module could not be used to
// get secure random number".
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry, LogBox } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
LogBox.ignoreAllLogs(true);

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Root = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

AppRegistry.registerComponent(appName, () => Root);
