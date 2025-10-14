import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Text,
  Keyboard,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
// import {CustomContainer} from '../../../components/container';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoder';
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer } from '../../../../components/container';
const LoginMap = ({navigation, route}) => {
//   const myregion = route?.params?.region;
  const [myregion, setMyregion] = useState({
    latitude:'',
    longitude:''
  })

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'ios') {
        getOneTimeLocation();
        subscribeLocationLocation();
      } else {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Access Required',
              message: 'This App needs to Access your location',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Okay',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            //To Check, If Permission is granted
            getOneTimeLocation();
            subscribeLocationLocation();
          } else {
            // ('Permission Denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    requestLocationPermission();
    return () => {
      Geolocation.clearWatch();
    };
  }, []);

  const getOneTimeLocation = () => {
    ('Getting Location ...');
    Geolocation.getCurrentPosition(
      //Will give you the current location
      position => {
        ('You are Here');
      },
      error => {
        console.log({error});
      },
      
    );
  };

  const subscribeLocationLocation = () => {
    watchID = Geolocation.watchPosition(
      position => {
        'You are Here', position;
        getCurrentAddress(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.log({error});
      },
      
    );
  };

  const getCurrentAddress = (Latitude, Longitude) => {
    var NY = {
      lat: Latitude,
      lng: Longitude,
    };
    Geocoder.geocodePosition(NY)
      .then(res => {
        // console.log({res: res});
        if (res) {
          // setLocationArea(res[0]);
        }
      })
      .catch(err => console.log(err));
  };

  return (
    <CustomContainer>
      <CustomHeader title={''} onBack={() => navigation.goBack()} />
      {/* {myregion && ( */}
        <MapView
          style={styles.map}
        //   provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: parseFloat(myregion.latitute),
            longitude: parseFloat(myregion.longitute),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          <Marker
            coordinate={{
              latitude: parseFloat(myregion.latitute),
              longitude: parseFloat(myregion.longitute),
            }}
          />
        </MapView>
      {/* )} */}

     
    </CustomContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
});

export default LoginMap;
