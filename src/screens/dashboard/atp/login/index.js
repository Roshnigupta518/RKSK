import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import CustomButton from '../../../../components/customButton';
import st from '../../../../global/styles';
import { colors } from '../../../../global';
import Field from '../../../../components/field';

const ATPDetailScreen = ({ navigation }) => {
    const data = {
        title: 'Peer Educator Training',
        startDate: '12/09/2025',
        startTime: '10:30 AM',
        endDate: '12/09/2025',
        endTime: '12:30 PM',
        block: 'Bhopal',
        ashaFacilitator: 'Name',
        ashaName: 'Name',
        village: 'Bhopal',
        purpose: 'Peer Educator Training',
        otherActivity: 'Other',
        duration: '10 Hour',
    };

    return (
        <CustomContainer>
            <CustomHeader title="ATP Login" onBackPress={() => navigation.goBack()} />
            <CustomContent>
                    <View style={styles.dateCard}>
                        <Text style={[st.tx14, st.txAlignC]}>
                            <Text style={{ color: colors.blue }}>12 Sep 2025</Text> Thursday
                        </Text>

                        <CustomButton title='LOG IN' 
                        onPress={()=>navigation.navigate('LoginMap')} 
                        />
                    </View>

                    <View style={styles.detailCard}>
                        <Text style={styles.title}>{data.title}</Text>
                        <Field label="Visit Start Date and Time" value={data.startDate} />
                        <Field label="Visit End Date and Time" value={data.endDate} />
                        <Field label="Block" value={data.block} />
                        <Field label="ASHA Facilitator (AF)" value={data.ashaFacilitator} />
                        <Field label="ASHA Name" value={data.ashaName} />
                        <Field label="Village" value={data.village} />
                        <Field label="Purpose of Visit" value={data.purpose} />
                        <Field label="Other Activity" value={data.otherActivity} />
                        <Field label="Duration" value={data.duration} />
                    </View>
            </CustomContent>
        </CustomContainer>
    );
};

export default ATPDetailScreen;

const styles = StyleSheet.create({
    dateCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 20,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2,
        padding: 20
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        ...st.tx14,
        ...st.txbold,
        marginBottom: 10,
    },
   
});
