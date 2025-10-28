import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ImageConstants from '../../../global/images';
import st from '../../../global/styles';
import MyInput from '../../../components/customInput';
import { colors } from '../../../global';
import Button from '../../../components/customButton';
import { postApi } from '../../../utils/apicalls'
import { handleAPIErrorResponse, isEmpty } from '../../../utils/validations'
import { API } from '../../../utils/endpoints';
import { sha256 } from 'react-native-sha256';
import DeviceInfo from 'react-native-device-info';
import CustomPopup from '../../../components/customPopup';
import { setLogin } from '../../../redux/slices/login';
import { useDispatch } from 'react-redux';
import {jwtDecode} from 'jwt-decode';

const INITIALINPUT = {
  userName: 'Jhabua#F2',
  password: 'Admin@123',
};

const Login = ({ navigation }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('')

  const dispatch = useDispatch()

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };


  const decodeToken = async(token) => {
    try {
      const decoded = jwtDecode(token);
      // console.log('Decoded token:', decoded);
  
      const userId = decoded.sub;           
      const email = decoded.email;         
      const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];  
      const divisionId = decoded.DivisionId;
      const districtId = decoded.DistrictId;
      const blockId = decoded.BlockId;
      const trainerId = decoded.TrainerId;
      const ngoId = decoded.NGOId;
      const jwtToken = token
  
      return {
        userId,
        email,
        role,
        divisionId,
        districtId,
        blockId,
        trainerId,
        ngoId,
        jwtToken
      };
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };

  const showMsg = () => {
    return (
      <CustomPopup
        visible={visible}
        title={"Login Failed"}
        message={message}
        onClose={() => setVisible(false)}
        onConfirm={handleConfirm}
        showCancel={false}
      />
    )
  }

  const validation = () => {
    let valid = true;

    if (isEmpty(inputs.userName)) {
      handleError('Username is required', 'userName');
      valid = false;
    } else {
      handleError(null, 'userName')
    }

    if (isEmpty(inputs.password)) {
      handleError('Password is required', 'password');
      valid = false;
    } else {
      handleError(null, 'password')
    }

    if (valid) {
      handlePress();
    }
  };

  const convertSHA = async (pass) => {
    try {
      const hash = await sha256(pass);
      return hash;
    } catch (error) {
      console.log('Error hashing password:', error);
      return null;
    }
  };

  const handleConfirm = () => {
    setVisible(false);
  };

  const handlePress = async () => {

    const url = `${API.LOGIN}`;
    const hashedPassword = await convertSHA(inputs.password);
    const params = {
      "username": inputs.userName,
      "password": hashedPassword,
      "ipAddress": ipAddress
    }
    try {
      setIsLoading(true);
      const result = await postApi(url, params);
      console.log({ result })
      if (result?.status == 200) {
        const data = result.data;
        const userData = await decodeToken(data.token);
        console.log({ userData });
        dispatch(setLogin(userData))
        setIsLoading(false);
        setInputs(INITIALINPUT)
      } else {
        setIsLoading(false);
        setVisible(true)
        setMessage(result.data.message)
      }
    } catch (e) {
      console.log('e login', e)
      setIsLoading(false);
      handleAPIErrorResponse(e, 'Login');
    }
  };


  useEffect(() => {
    const fetchIp = async () => {
      try {
        const ip = await DeviceInfo.getIpAddress(); 
        setIpAddress(ip);
      } catch (error) {
        console.log('Error fetching IP:', error);
      }
    };

    fetchIp();
  }, []);

  return (
    <>
      <ImageBackground source={ImageConstants.login_bg} style={st.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <View style={styles.loginContainer}>
                <Text style={[st.tx22, st.txAlignC]}>Login</Text>

                <MyInput
                  placeholder="Username"
                  onChangeText={text => handleOnchange(text, 'userName')}
                  onFocus={() => handleError(null, 'userName')}
                  error={errors?.userName}
                  value={inputs.userName}
                  iconName="user"
                  disabled={isLoading}
                />

                <MyInput inputsty={st.align_C}
                  placeholder="Password"
                  onChangeText={text => handleOnchange(text, 'password')}
                  onFocus={() => handleError(null, 'password')}
                  error={errors?.password}
                  value={inputs.password}
                  password
                  iconName="lock"
                  disabled={isLoading}
                />

                <View style={st.mt_10} />
                <Button
                  title="Login"
                  onPress={validation}
                  // onPress={()=>navigation.navigate('ATPListScreen')}
                  loading={isLoading}
                  disabled={isLoading}
                />
              </View>
            </View>

          </TouchableWithoutFeedback>

        </KeyboardAvoidingView>
        {showMsg()}
      </ImageBackground>

    </>
  );
};

export default Login;

const styles = StyleSheet.create({
  loginContainer: {
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    backgroundColor: colors.white,
    padding: 20,
    width: '100%',
  },
});
