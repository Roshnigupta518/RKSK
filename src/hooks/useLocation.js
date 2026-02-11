import { useEffect, useState, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert, Linking, AppState } from 'react-native';
import Geocoder from 'react-native-geocoder-reborn';
import SendIntentAndroid from 'react-native-send-intent';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationArea, setLocationArea] = useState(null);
  const appState = useRef(AppState.currentState);
  const isRequesting = useRef(false); // 🧠 prevent duplicate getLocation calls

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      SendIntentAndroid.openSettings('android.settings.LOCATION_SOURCE_SETTINGS');
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const openAppSettings = () => {
    Linking.openSettings(); // Opens app-specific permission settings
  };

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await Geocoder.geocodePosition({ lat, lng });
      const formattedAddress = res[0]?.formattedAddress;
      setLocationArea(formattedAddress || null);
    } catch (err) {
      console.log('Geocode error:', err);
    }
  };

  const permissionHandle = () => {
    setError('permissionDenied');
    Alert.alert(
      'Permission Required',
      'Location permission is denied. Please allow access in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openAppSettings },
      ]
    );
  }

  const getLocation = async () => {
    // 🛑 prevent multiple simultaneous calls
    if (isRequesting.current) return;
    isRequesting.current = true;

    setLoading(true);
    setError(null);

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      // setError('Location permission denied');
      permissionHandle()
      setLoading(false);
      isRequesting.current = false;
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
        getAddressFromCoords(position.coords.latitude, position.coords.longitude);
        isRequesting.current = false;
      },
      (error) => {
        console.log('Location error:', error);

        if (error.code === 2) {
          setError('gps-off');
          Alert.alert(
            'Enable GPS',
            'Your location services are turned off. Please enable GPS to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openLocationSettings },
            ]
          );
        } else if (error.code === 3) {
          setError('Location request timed out');
        } else {
          // setError(error.message);
        
            // GPS ON but permission denied or other issue
            permissionHandle()
          
        }

        setLoading(false);
        isRequesting.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  };

  useEffect(() => {
    getLocation();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // 🧠 Only try again if permission was previously denied or GPS was off
        if (error || !location) {
          getLocation();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return { location, error, loading, locationArea, getLocation, openLocationSettings, permissionHandle };
};

