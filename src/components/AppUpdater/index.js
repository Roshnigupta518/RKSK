import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { appUpdateRequest } from '../../utils/services';

const AppUpdateChecker = () => {

  const getLatestVersionFromServer = async () => {
    try {
      const result = await appUpdateRequest();
      console.log({result})
      const data = result?.data;
      // return data[0]?.versionName;
      return 1.1
    } catch (e) {
      alert(e)
    }
  };

  const checkForUpdates = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion();
      const latestVersion = await getLatestVersionFromServer();

      console.log({latestVersion, currentVersion});
      if (latestVersion && currentVersion < latestVersion) {
        Alert.alert(
          'Update Required',
          'A new version of the app is available. Please update to continue using the app.',
          [
            {
              text: 'Update Now',
              onPress: () => {
                if (Platform.OS == 'android') {
                  Linking.openURL(
                    'https://play.google.com/store/apps/details?id=com.rksk',
                  );
                } 
              },
            },
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
          ],
          // {cancelable: false},
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };
  
  useEffect(() => {
      checkForUpdates();
  }, []);

  return null;
};

export default AppUpdateChecker;
