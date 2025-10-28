import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';
import { timeDifferenceFun, formatTime } from '../../../../utils/helper';
import Icon from 'react-native-vector-icons/Feather';

const ATPDetailScreen = ({ navigation, route }) => {
    const attendance = useSelector(state => state.clockTime?.loginDetails);
    const loginDetails = useSelector(state => state.login?.data);
    const logoutDetails = useSelector(state => state.clockTime?.logoutDetails);

    // console.log({attendance})

    const { activiyDetails } = route.params || {}
    const [timeDifference, setTimeDifference] = useState('');

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

    useEffect(() => {
        if (attendance) {
            const storedTime = new Date(attendance?.loginTime);

            const interval = setInterval(() => {
                const difference = timeDifferenceFun(
                    storedTime,
                    attendance?.logoutTime,
                );
                setTimeDifference(difference);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [attendance]);

    return (
        <CustomContainer>
            <CustomHeader title="ATP Login" onBackPress={() => navigation.goBack()} />
            <CustomContent>
                <View style={styles.dateCard}>
                    <Text style={[st.tx14, st.txAlignC]}>
                        <Text style={{ color: colors.blue }}>12 Sep 2025</Text> Thursday
                    </Text>
                    {(!attendance?.loginTime || (attendance?.loginTime && logoutDetails?.logoutTime)) ? (
                        <CustomButton title='LOG IN'
                            onPress={() => navigation.navigate('LoginMap', { atP_Id:activiyDetails.atP_Id })}
                        />
                    ) : (
                        <View style={styles.content_logout}>
                            <TouchableOpacity
                                style={styles.logoutcontainer}
                                onPress={() => navigation.navigate('LoginMap', { atP_Id:activiyDetails.atP_Id })}>
                                <Text style={[st.tx16, { color: colors.white }]}>LOG OUT</Text>
                            </TouchableOpacity>
                            <View style={st.wdh50}>
                                <View style={st.center}>
                                    <Text style={st.tx12}>{timeDifference}</Text>
                                    <View style={[st.row, st.align_C]}>
                                        <Icon
                                            name={'arrow-down-left'}
                                            size={20}
                                            color={colors.success}
                                        />
                                        <Text style={[st.tx12, { color: colors.grey }]}>
                                            {formatTime(attendance?.loginTime)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                </View>

                <View style={styles.detailCard}>
                    <Text style={styles.title}>{data.title}</Text>
                    <Field label="Visit Start Date and Time" value={activiyDetails.visit_Start_Date} />
                    <Field label="Visit End Date and Time" value={activiyDetails.visit_End_Date} />
                    <Field label="Block" value={activiyDetails.blockNameE} />
                    <Field label="ASHA Facilitator (AF)" value={activiyDetails.ashaSahyogi_Name} />
                    <Field label="ASHA Name" value={activiyDetails.ashaNameEnglish} />
                    <Field label="Village" value={activiyDetails.villageName} />
                    <Field label="Purpose of Visit" value={activiyDetails.visit_Purpose} />
                    <Field label="Other Activity" value={activiyDetails.other_Activity} />
                    <Field label="Duration" value={activiyDetails.duration} />
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
    content_logout: {
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.blue,
        flexDirection: 'row',
        marginTop: 20,
    },
    logoutcontainer: {
        backgroundColor: colors.blue,
        padding: 10,
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
