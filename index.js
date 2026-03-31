/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry,LogBox } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
LogBox.ignoreAllLogs(true)
// AppRegistry.registerComponent(appName, () => App);

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Root = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <App />
  </GestureHandlerRootView>
);

AppRegistry.registerComponent(appName, () => Root);
