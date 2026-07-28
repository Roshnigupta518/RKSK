import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export default function useLocationStatus() {
  const [hasPermission, setHasPermission] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const checkLocationStatus = async () => {
    try {
      // --- CHECK PERMISSION ---
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (!granted) {
          setHasPermission(false);
          setGpsEnabled(false); // permission nahi to GPS ka kya hi check kare
          return;
        } else {
          setHasPermission(true);
        }
      }

      // --- CHECK GPS USING GEOLOCATION ---
      Geolocation.getCurrentPosition(
        () => {
          setGpsEnabled(true);
        },
        (error) => {
          // Error code 2 → GPS off
          setGpsEnabled(false);
        },
        // { enableHighAccuracy: true, timeout: 3000 }
      );
    } catch (error) {
      setGpsEnabled(false);
    }
  };

  useEffect(() => {
    // check on mount
    checkLocationStatus();

    // poll every 3 seconds for GPS shutter on/off
    const interval = setInterval(checkLocationStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // --- OPEN SETTINGS FUNCTIONS ---
  const openGPSSettings = () => {
    if (Platform.OS === 'android') {
      // Linking.sendIntent is Android-only and replaces react-native-send-intent
      // for this narrow use-case. Wrapped so a missing activity falls back to
      // the app-level settings screen instead of throwing.
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
        Linking.openSettings();
      });
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const openAppSettings = () => {
    Linking.openSettings(); // open app permission settings
  };

  return { hasPermission, gpsEnabled, openGPSSettings, openAppSettings };
}
