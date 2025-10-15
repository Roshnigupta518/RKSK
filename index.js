/**
 * @format
 */
import 'react-native-reanimated';
import { AppRegistry,LogBox } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import 'react-native-gesture-handler';
LogBox.ignoreAllLogs(true)
AppRegistry.registerComponent(appName, () => App);
