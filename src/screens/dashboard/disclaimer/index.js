import { StyleSheet, Text, View , BackHandler, Alert } from 'react-native'
import React,{useCallback} from 'react'
import { CustomContainer, CustomContent } from '../../../components/container'
import CustomHeader from '../../../components/customHeader';
import st from '../../../global/styles';
import { colors } from '../../../global';
import { useAppSelector, useAppDispatch } from '../../../hooks';
import { setDisClaimerStatus } from '../../../redux/slices/disclaimer';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../../../components/customButton';
const Disclaimer = ({ navigation }) => {
    const onBoarding = useAppSelector(state => state.login.data); 
    const dispatch = useAppDispatch()

    const handlePress = () => {
        if(!onBoarding){
        navigation.navigate('Login')
        dispatch(setDisClaimerStatus(true))
       }
        else{
        navigation.goBack()}
      };

      useFocusEffect(
        useCallback(() => {
        const backAction = () => {
          Alert.alert(
            'Exit From RKSK',
            'Are you sure you want to close this application?',
            [
              {
                text: 'Cancel',
                onPress: () => null,
                style: 'cancel',
              },
              { text: 'YES', onPress: () => BackHandler.exitApp() },
            ],
          );
          return true;
        };
    
        if(!onBoarding){
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction,
        );
        return () => backHandler.remove();
      }
    
      return true
    
      }, [navigation]) 
    );

    return (
        <CustomContainer>
       {!onBoarding &&
            <CustomHeader title="Disclaimer"  />
       }

            <CustomContent>
                <Text style={[st.tx16, {color:colors.blue}]}>Disclaimer for RKSK MP Mobile App</Text>
                <Text style={[st.tx12, {lineHeight:30}]}>The RKSK MP Mobile App is for official use under NHM Madhya Pradesh. While every effort is made to secure and protect your data, NHM MP is not responsible for unauthorized access caused by external factors beyond its control.</Text>
            </CustomContent>
            <View style={st.pd20}>
            { !onBoarding &&
      <Button
          title={'I Accept'}
          onPress={() => handlePress()}
          backgroundColor={colors.orange}
        />}
        </View>
        </CustomContainer>
    )
}

export default Disclaimer

const styles = StyleSheet.create({})