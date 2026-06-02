/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import { handleBackgroundNotificationEvent } from './src/hooks/usePhoneNotificationHandlers';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  await handleBackgroundNotificationEvent(type, detail.notification?.data);
});

AppRegistry.registerComponent(appName, () => App);
