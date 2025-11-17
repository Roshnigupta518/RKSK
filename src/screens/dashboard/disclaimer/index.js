import { StyleSheet, Text, View, BackHandler, Alert } from 'react-native'
import React, { useCallback, useState } from 'react'
import { CustomContainer, CustomContent } from '../../../components/container'
import CustomHeader from '../../../components/customHeader';
import st from '../../../global/styles';
import { colors } from '../../../global';
import { useAppSelector, useAppDispatch } from '../../../hooks';
import { setDisClaimerStatus } from '../../../redux/slices/disclaimer';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../../../components/customButton';
import ExitModal from '../../../components/ExitModal';

const Disclaimer = ({ navigation }) => {
  const onBoarding = useAppSelector(state => state.login.data);
  const dispatch = useAppDispatch()
  const [exitModal, setExitModal] = useState(false);

  const handlePress = () => {
    if (!onBoarding) {
      navigation.navigate('Login')
      dispatch(setDisClaimerStatus(true))
    }
    else {
      navigation.goBack()
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (onBoarding) {
        // User logged-in → Sidebar → NO EXIT POPUP
        return;
      }
  
      // User not logged-in → Login se pehle → SHOW EXIT POPUP
      const backAction = () => {
        setExitModal(true);
        return true;
      };
  
      const handler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
  
      return () => handler.remove();
    }, [onBoarding])
  );
  

  return (
    <CustomContainer>
      {!onBoarding &&
        <CustomHeader title="Disclaimer" />
      }

      <CustomContent>
        {/* <Text style={[st.tx16, {color:colors.blue}]}>Disclaimer for RKSK MP Mobile App</Text> */}
        <Text style={[st.tx12, { lineHeight: 30 }]}>The RKSK MP Mobile App is for official use under NHM Madhya Pradesh. While every effort is made to secure and protect your data, NHM MP is not responsible for unauthorized access caused by external factors beyond its control.</Text>
      </CustomContent>
      <View style={st.pd20}>
        {!onBoarding &&
          <Button
            title={'I Accept'}
            onPress={() => handlePress()}
            backgroundColor={colors.orange}
          />}
      </View>

      <ExitModal
        visible={exitModal}
        onCancel={() => setExitModal(false)}
        onExit={() => {
          setExitModal(false);
          BackHandler.exitApp();
        }}
      />

    </CustomContainer>
  )
}

export default Disclaimer

const styles = StyleSheet.create({})