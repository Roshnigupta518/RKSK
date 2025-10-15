import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { CustomContainer, CustomContent } from '../../../components/container'
import CustomHeader from '../../../components/customHeader';
import st from '../../../global/styles';
import { colors } from '../../../global';

const Disclaimer = ({ navigation }) => {
    return (
        <CustomContainer>
            {/* <CustomHeader title="Disclaimer" onBackPress={() => navigation.goBack()} /> */}
            <CustomContent>
                <Text style={[st.tx16, {color:colors.blue}]}>Disclaimer for RKSK MP Mobile App</Text>
                <Text style={[st.tx12, {lineHeight:30}]}>The RKSK MP Mobile App is for official use under NHM Madhya Pradesh. While every effort is made to secure and protect your data, NHM MP is not responsible for unauthorized access caused by external factors beyond its control.</Text>
            </CustomContent>
        </CustomContainer>
    )
}

export default Disclaimer

const styles = StyleSheet.create({})