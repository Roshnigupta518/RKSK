import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Text,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CustomContainer } from '../../../../components/container';
import st from '../../../../global/styles';
import Button from '../../../../components/customButton';
import {
  formatDate,
  formatTime,
} from '../../../../utils/helper';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from '../../../../utils/validations';
import { useLocation } from '../../../../hooks/useLocation';
import CustomHeader from '../../../../components/customHeader';
import MyInput from '../../../../components/customInput'
import { updateActivityPlanItem } from '../../../../redux/slices/ActivityPlan';
import { reStartBackgroundService } from '../../../../utils/bgservices/backgroundService';
import { syncTaskName } from '../../../../utils/bgservices/backgroundTaskEnum';
import { addToQueue } from '../../../../redux/slices/queueSlice';

const INITIALINPUT = {
  remark: '',
};

const App = ({ navigation, route }) => {
  const [date, setDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [time, setTime] = useState();

  const { activiyDetails } = route.params || {}

  const { location, locationArea } = useLocation();
  const dispatch = useDispatch()

  const userLogin = useSelector(state => state.login.data);

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };

  useEffect(() => {
    const date = new Date();
    const todayDate = formatDate(date);
    setDate(todayDate);
  }, []);

  const validation = () => {
    Keyboard.dismiss();
    const emptyRemark = isEmpty(inputs?.remark);

    let isValid = true;

    if (emptyRemark) {
      handleError('*Required', 'remark');
      isValid = false;
    } else {
      handleError('', 'remark');
    }

    if (isValid) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setIsLoading(true)
    const params = {
      clockinTime: new Date().toISOString(),
      clockinAddress: locationArea,
      clockin_lat: location.latitude,
      clockin_long: location.longitude,
      updatedBy: userLogin.userId,
      mode: 1
    }

    dispatch(updateActivityPlanItem({
      atP_Id: activiyDetails.atP_Id,
      newData: params
    }));

    dispatch(addToQueue({
      type: "CLOCK_IN",
      payload: {
        atP_Id: activiyDetails.atP_Id,
        ...params
      }
    }));

    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'MainApp', 
          state: {
            routes: [{ name: 'ATPListScreen' }],
          },
        },
        {
          name: 'ATPForm',
          params: { atP_Id: activiyDetails.atP_Id },
        },
      ],
    });

    await reStartBackgroundService(syncTaskName.syncAcitivityQueue)
    setIsLoading(false)
  };

  const handleLogOut = async () => {
    setIsLoading(true)
      const params = {
        "atP_Id": activiyDetails.atP_Id,
        "clockoutTime": new Date().toISOString(),
        "clockoutAddress": locationArea,
        "clockout_lat": location?.latitude,
        "clockout_long": location?.longitude,
        "createdBy": userLogin.userId,
        "updatedBy": userLogin.userId,
        "mode": 2
      }

      dispatch(updateActivityPlanItem({
        atP_Id: activiyDetails.atP_Id,
        newData: params
      }));

      dispatch(addToQueue({
        type: "CLOCK_OUT",
        payload: {
          atP_Id: activiyDetails.atP_Id,
          ...params
        }
      }));

      await reStartBackgroundService(syncTaskName.syncAcitivityQueue);

      navigation.reset({
        index: 1,
        routes: [
          {
            name: 'MainApp', 
            state: {
              routes: [{ name: 'ATPListScreen' }],
            },
          },
        ],
      });

      setIsLoading(false)
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const time = formatTime();
      setTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CustomContainer>
      <CustomHeader title={''} onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {location &&
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            followUserLocation={true}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude || 0,
                  longitude: location.longitude || 0,
                }}
              />
            )}
          </MapView>
        }

        <View style={[st.pd_H20, st.mt_5]}>
          <View>
            <Text style={[st.tx12, st.txbold]}>LOCATION</Text>
            <Text style={st.tx12}>{locationArea}</Text>
          </View>
          {(!activiyDetails?.clockinTime || (activiyDetails?.clockinTime && activiyDetails?.clockoutTime)) && (
            <View>
              <MyInput
                onChangeText={text => handleOnchange(text, 'remark')}
                onFocus={() => handleError(null, 'remark')}
                error={errors?.remark}
                value={inputs.remark}
                placeholder={'Enter remark'}
              />
            </View>
          )}

          <View style={st.mb_10}>
            <View style={[st.row, st.align_C, st.justify_S]}>
              <View style={st.wdh70}>
                <Text style={st.tx16}>{time}</Text>
                <Text style={st.tx12}>{date}</Text>
              </View>
              <View style={st.wdh30}>
                <Button
                  disabled={(locationArea) ? false : true}
                  loading={isLoading}
                  title={
                    !activiyDetails?.clockinTime ||
                      (activiyDetails?.clockinTime && activiyDetails?.clockoutTime)
                      ? 'Clock In'
                      : 'Clock Out'
                  }
                  onPress={() => {
                    if ((!activiyDetails?.clockinTime || (activiyDetails?.clockinTime &&
                      activiyDetails?.clockoutTime))) {
                      validation();
                    } else {
                      handleLogOut()
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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

export default App;
