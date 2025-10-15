import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  Text,
  Linking,
  Alert,
  Keyboard,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {CustomContainer} from '../../../../components/container';
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
import {useDispatch, useSelector} from 'react-redux';
import {API} from '../../../../utils/endpoints';
import {postApi} from '../../../../utils/apicalls';
// import {ValueEmpty} from '../../../../utils/validations';
import { isEmpty } from '../../../../utils/validations';
import {useLocation} from '../../../../hooks/useLocation';
// import {getAttandanceHandle} from '../../../../API/attandance';
import CustomHeader from '../../../../components/customHeader';
import MyInput from '../../../../components/customInput'
import { handleAPIErrorResponse } from '../../../../utils/validations';

const INITIALINPUT = {
  remark: '',
};

const App = ({navigation}) => {
  // const [region, setRegion] = useState(null);
  const [date, setDate] = useState(null);
  // const [locationArea, setLocationArea] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [time, setTime] = useState();

  const dispatch = useDispatch();

  const {region, locationArea} = useLocation();

  const attendance = useSelector(state => state.clockTime?.loginDetails);
  const loginDetails = useSelector(state => state.login?.data);
  const logoutDetails = useSelector(state => state.clockTime?.logoutDetails);

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({...prevState, [input]: text}));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({...prevState, [input]: error}));
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
      navigation.navigate('ATPForm')
      // handleLogin();
    }
  };

  // const handleLogin = async () => {
  //   const currentDateTime = new Date();
  //   const url = `${API.ATTENDANCE_LOGIN}`;
  //   const param = {
  //     divisionID: loginDetails.data.division.divisionID,
  //     districtID: loginDetails.data.district.districtID,
  //     remarks: inputs?.remark,
  //     attendancedate: currentDateTime,
  //     loginTime: '',
  //     loginLocation: locationArea.locality,
  //     logoutLocation: '',
  //     logoutTime: '',
  //     blockID: loginDetails.data.block.blockID,
  //     ashasahyogiID: loginDetails.data.ashasahyogiID,
  //     loginlat: region.latitude,
  //     loginlong: region.longitude,
  //   };
  //   try {
  //     setIsLoading(true);
  //     const result = await postApi(url, param);
  //     if (result.status == 200) {
  //       const data = result.data;
  //       console.log({data});
  //       if (data.status == 'Your attendance for today is already logged') {
  //         setIsLoading(false);
  //         alert(data.status);
  //       } else {
  //         setIsLoading(false);
  //         // dispatch(setClockIn(data));
  //         getAttandanceHandle(dispatch);
  //         navigation.goBack();
  //       }
  //     }
  //   } catch (e) {
  //     console.log(e);
  //     setIsLoading(false);
  //     handleAPIErrorResponse(e);
  //   }
  // };

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

      <View style={st.pd20}>
        <View>
          <Text style={[st.tx12, {color: colors.grey}]}>LOCATION</Text>
          <Text style={st.tx12}>{locationArea?.formattedAddress}</Text>
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
                  (attendance?.loginTime && attendance?.logoutTime)
                    ? 'Login'
                    : 'Logout'
                }
                onPress={() => {
                  console.log({attendance, logoutDetails});
                  if ((!attendance?.loginTime || (attendance?.loginTime && attendance?.logoutTime))) {
                    dispatch(clearClock());
                    validation();
                  } else {
                    // handleLogOut();
                    alert('logout')
                  }
                }}
                // backgroundColor={
                //   locationArea
                //     ? [colors.secondary, colors.secondary]
                //     : [colors.grey, colors.grey]
                // }
              />
            </View>
          </View>
        </View>
      </View>

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
