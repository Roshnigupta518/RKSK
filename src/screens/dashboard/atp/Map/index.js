import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Text,
  Linking,
  Alert,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { CustomContainer } from '../../../../components/container';
import st from '../../../../global/styles';
import { colors } from '../../../../global';
import Button from '../../../../components/customButton';
import {
  formatDate,
  formatTime,
} from '../../../../utils/helper';
import {
  setClockIn,
  setClockOut,
  clearClock,
} from '../../../../redux/slices/ClockTime';
import { useDispatch, useSelector } from 'react-redux';
import { API } from '../../../../utils/endpoints';
import { postApi } from '../../../../utils/apicalls';
// import {ValueEmpty} from '../../../../utils/validations';
import { isEmpty } from '../../../../utils/validations';
import { useLocation } from '../../../../hooks/useLocation';
// import {getAttandanceHandle} from '../../../../API/attandance';
import CustomHeader from '../../../../components/customHeader';
import MyInput from '../../../../components/customInput'
import { handleAPIErrorResponse } from '../../../../utils/validations';
import { activityLoginRequest } from '../../../../utils/services';

const INITIALINPUT = {
  remark: '',
};

const App = ({ navigation, route }) => {
  // const [region, setRegion] = useState(null);
  const [date, setDate] = useState(null);
  // const [locationArea, setLocationArea] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [time, setTime] = useState();

  const dispatch = useDispatch();
  const {activiyDetails} = route.params || {}

  const mode = !activiyDetails.clockinTime ? 1 : 2

  const { region, locationArea } = useLocation();

  const attendance = useSelector(state => state.clockTime?.loginDetails);
  const loginDetails = useSelector(state => state.login?.data);
  const logoutDetails = useSelector(state => state.clockTime?.logoutDetails);
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
    // console.log({attendance, logoutDetails});
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
      const data = {
        loginTime : new Date()
      }
      dispatch(setClockIn(data))
      navigation.navigate('ATPForm',{activiyDetails})
      // handleLogin();
    }
  };

  const handleLogin = async () => {

   try{
    const params = {
      "atP_Id": activiyDetails.atP_Id,
      "clockinTime": mode === 1 ? new Date() : null,
      "clockinAddress": mode === 1 ? locationArea : null,
      "clockin_lat": mode === 1 ? location.latitude : null,
      "clockin_long": mode === 1 ? location.longitude : null,
      "clockoutTime":  mode === 2 ? new Date() : null,
      "clockoutAddress": mode === 2 ? locationArea : null,
      "clockout_lat":  mode === 2 ? location.latitude : null,
      "clockout_long":  mode === 2 ? location.longitude : null,
      "createdBy": userLogin.userId,
      "updatedBy": userLogin.userId,
      // "createdOn": "2025-10-31T11:46:02.816Z",
      // "modifyOn": "2025-10-31T11:46:02.816Z",
      "mode": mode
    }
      const result = await activityLoginRequest(params)
      if (result) {

        console.log('result clock in', result)
        // navigation.navigate('ATPForm',{activiyDetails})

      }else{

      }
   }catch(e){

   }
  };

  // const handleLogOut = async () => {
  //   const currentDateTime = new Date();

  //   const url = `${API.ATTENDANCE_LOGOUT}`;
  //   const param = {
  //     divisionID: loginDetails.data.division.divisionID,
  //     districtID: loginDetails.data.district.districtID,
  //     remarks: inputs?.remark,
  //     attendancedate: currentDateTime,
  //     loginTime: '',
  //     loginLocation: '',
  //     logoutLocation: locationArea.locality,
  //     logoutTime: '',
  //     blockID: loginDetails.data.block.blockID,
  //     ashasahyogiID: loginDetails.data.ashasahyogiID,
  //     logoutlat: region.latitude,
  //     logoutlong: region.longitude,
  //   };
  //   try {
  //     setIsLoading(true);
  //     const result = await postApi(url, param);
  //     if (result.status == 200) {
  //       const data = result.data;
  //       console.log({data});
  //       setIsLoading(false);
  //       // dispatch(setClockOut(data));
  //       getAttandanceHandle(dispatch);
  //       navigation.goBack();
  //     }
  //   } catch (e) {
  //     setIsLoading(false);
  //     handleAPIErrorResponse(e);
  //   }
  // };

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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followUserLocation={true}
        initialRegion={region}>
        {region && (
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
          />
        )}
      </MapView>
     
        <View style={[st.pd_H20, st.mt_5]}>
          <View>
            <Text style={[st.tx12, st.txbold]}>LOCATION</Text>
            <Text style={st.tx12}>{locationArea}</Text>
          </View>
          {(!attendance?.loginTime || (attendance?.loginTime && attendance?.logoutTime)) && (
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

          <View>
            <View style={[st.row, st.align_C, st.justify_S]}>
              <View style={st.wdh70}>
                <Text style={st.tx16}>{time}</Text>
                <Text style={st.tx12}>{date}</Text>
              </View>
              <View style={st.wdh30}>
                <Button
                  disabled={locationArea ? false : true}
                  title={
                    !attendance?.loginTime ||
                      (attendance?.loginTime && logoutDetails?.logoutTime)
                      ? 'Clock In'
                      : 'Clock Out'
                  }
                  onPress={() => {
                    console.log({ attendance, logoutDetails });
                    if ((!attendance?.loginTime || (attendance?.loginTime && logoutDetails?.logoutTime))) {
                      dispatch(clearClock());
                      validation();
                    } else {
                      // handleLogOut();
                      // alert('logout')
                      const data = {
                        logoutTime : new Date()
                      }
                      dispatch(setClockOut(data))
                      navigation.goBack()
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      {/* <Loader loading={isLoading} /> */}
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
