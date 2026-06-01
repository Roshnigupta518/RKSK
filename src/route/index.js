import { StyleSheet, Text, View,ActivityIndicator, StatusBar, Platform, PermissionsAndroid, Alert  } from 'react-native'
import React,{useState, useEffect} from 'react'
import { NavigationContainer } from '@react-navigation/native';
import Splash from '../screens/auth/splash';
import AuthStack from './AuthStack'
import {useAppSelector} from '../hooks'
import HomeStack from './HomeStack'
import NetworkStatus from '../components/NetworkStatus'
import Toast from 'react-native-toast-message';
import MyToast from '../components/customToast';
import AppUpdateChecker from '../components/AppUpdater';
import useLocationStatus from '../hooks/useLocationStatus';
import st from '../global/styles';
import { colors } from '../global';
import LocationBanner from '../components/LocationBanner';
const index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const onBoarding = useAppSelector(state => state.login.data);
  // const locationEnabled = useLocationStatus();

  const {
    hasPermission,
    gpsEnabled,
    openGPSSettings,
    openAppSettings,
  } = useLocationStatus();

  const GetRequiredPermissions = async () => {
    try {
      let permissionArr =
        Platform.Version >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
              PermissionsAndroid.PERMISSIONS.CAMERA,
            ]
          : [
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
              PermissionsAndroid.PERMISSIONS.CAMERA,
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            ];

      const granted = await PermissionsAndroid.requestMultiple(permissionArr, {
        title: 'Hope App Camera Permission',
        message:
          'Hope App needs access to your Location ',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the Location');
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        await GetRequiredPermissions();
      }
      setTimeout(() => setIsLoading(false), 3000); // splash delay
    };
    init();
  }, []);

  const toastConfig = {
    myCustomType: (props) => <MyToast {...props} />, 
  };

  return (
    <NavigationContainer fallback={<ActivityIndicator />} detachInactiveScreens={false} >
    <StatusBar
      translucent
      barStyle={'light-content'}
      backgroundColor={'transparent'}
    />
    {isLoading ? <Splash /> : !onBoarding ? <AuthStack /> : <HomeStack />}
    <NetworkStatus />
    <Toast config={toastConfig} />

       {/* Permission Banner */}
       {!hasPermission && (
        <LocationBanner
          message="Location permission is denied."
          buttonText="Give Permission"
          onPress={openAppSettings}
        />
      )}

      {/* GPS Banner */}
      {hasPermission && !gpsEnabled && (
        <LocationBanner
          message="GPS is OFF."
          buttonText="Turn ON GPS"
          onPress={openGPSSettings}
        />
      )}
    <AppUpdateChecker />
  </NavigationContainer>
  )
}

export default index

const styles = StyleSheet.create({})