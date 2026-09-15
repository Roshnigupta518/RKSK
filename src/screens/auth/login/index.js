import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  KeyboardAvoidingView,
  Platform, TouchableWithoutFeedback, Keyboard, Image
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
import { wp } from '../../../global';
import { onLogin } from '../../../utils/bgservices/tiggerfunction';
import useNetworkStatus from '../../../hooks/networkStatus';
import { setIpAddressLogin } from '../../../redux/slices/getIpAddress';
import { SecureTokenService } from '../../../utils/security';
import { logger } from '../../../utils/logger';

const INITIALINPUT = {
  //Peer educator login
  // userName: 'JHBUA6099', 
  // password: '123456',

  //Trainer login
  userName: 'Jhabua#F2', //Basoda#M1  
  password: 'Admin@123',

  // live trainer login
  //  userName: 'Ghughri#M2', 
  //  password: 'Admin@123',

  // userName: '', 
  // password: '',
};

const Login = ({ navigation }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('')

  const dispatch = useDispatch()
  const isConnected = useNetworkStatus();

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };

// console.log({isConnected})
  // F-04: return the non-secret profile claims. The raw JWT itself is
  // routed to Keychain via SecureTokenService in handlePress(), never
  // included in the payload dispatched to redux-persist.
  const decodeToken = async (token) => {
    try {
      const decoded = jwtDecode(token);

      const userId = decoded.sub;
      const email = decoded.email;
      const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const divisionId = decoded.DivisionId;
      const districtId = decoded.DistrictId;
      const blockId = decoded.BlockId;
      const trainerId = decoded.TrainerId;
      const ngoId = decoded.NGOId;
      const peerEducatorId = decoded.PeerEducatorId;

      return {
        userId,
        email,
        role,
        divisionId,
        districtId,
        blockId,
        trainerId,
        ngoId,
        peerEducatorId,
      };
    } catch (error) {
      // F-05: never print the token itself or the raw error payload — the
      // jwtDecode error message can echo the input string. Log only the
      // error class.
      logger.error('Invalid token', { name: error?.name, message: error?.message });
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
      // F-05: never let the error object echo the plaintext password.
      logger.error('Error hashing password:', { name: error?.name, message: error?.message });
      return null;
    }
  };

  const handleConfirm = () => {
    setVisible(false);
  };

  const handlePress = async () => {

    const url = `${API.LOGIN}`;
    const hashedPassword = await convertSHA(inputs.password);
    dispatch(setIpAddressLogin(ipAddress))
    const params = {
      "username": inputs.userName,
      "password": hashedPassword,
      "ipAddress": ipAddress
    }
    try {
      setIsLoading(true);
      const result = await postApi(url, params);
      // F-05: full login response contains the raw JWT — never log it.
      // Log only the transport status.
      logger.info('Login response received', { status: result?.status });
      if (result?.status == 200) {
        const data = result.data;
        const userData = await decodeToken(data.token);
        if (!userData) {
          setIsLoading(false);
          setVisible(true);
          setMessage('Invalid session token received. Please try again.');
          return;
        }
        // F-04: JWT goes to Keychain; only non-secret profile claims to redux.
        await SecureTokenService.setToken(data.token);
        dispatch(setLogin(userData));
        setIsLoading(false);
        setInputs(INITIALINPUT);
        onLogin();
      } else {
        setIsLoading(false);
        setVisible(true)
        setMessage(result.data.message)
      }
    } catch (e) {
      // F-05: `e` is an axios error whose config contains the plaintext
      // credentials we just POSTed. Log only status + message.
      logger.error('Login request failed', { status: e?.status, message: e?.message });
      if(e.status == 401){
        setVisible(true)
        setMessage("Invalid ID or Password. Please try again.")
      }
      handleAPIErrorResponse(e, 'Login');
    }finally{
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const fetchIp = async () => {
      try {
        const ip = await DeviceInfo.getIpAddress(); 
        setIpAddress(ip);
      } catch (error) {
        logger.warn('Error fetching IP:', { message: error?.message });
      }
    };

    fetchIp();
  }, []);

  const isButtonDisabled = isLoading || !isConnected;

  return (
    <>
      <ImageBackground source={ImageConstants.login_bg} style={st.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
            
            <View style={[st.align_C,{marginTop:'30%'}]}>
              <Image source={ImageConstants.round_logo} 
              style={{width:wp(150), height:wp(150)}} />
              <Text style={[st.tx14, st.txAlignC, {color:colors.white}]}>
              {'\n'}RASHTRIYA KISHOR SWASTHYA KARYAKRAM,{'\n'} Madhya Pradesh{'\n'}{'\n'}
              राष्ट्रीय किशोर स्वास्थ्य कार्यक्रम मध्य प्रदेश
              </Text>
            </View>

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
                  loading={isLoading}
                  disabled={isButtonDisabled}
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
