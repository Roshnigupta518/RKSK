import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView, Image
} from 'react-native';
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import CustomButton from '../../../../components/customButton';
import st from '../../../../global/styles';
import { colors } from '../../../../global';
import Field from '../../../../components/field';
import { useSelector } from 'react-redux';
import { timeDifferenceFun, formatTime, formatDate } from '../../../../utils/helper';
import Icon from 'react-native-vector-icons/Feather';
import { environment } from '../../../../utils/constant'
import Video from 'react-native-video';
import { useIsFocused } from '@react-navigation/native';

const ATPDetailScreen = ({ navigation, route }) => {
    const attendance = useSelector(state => state.clockTime?.loginDetails);
    const loginDetails = useSelector(state => state.login?.data);
    const logoutDetails = useSelector(state => state.clockTime?.logoutDetails);

    // console.log({attendance})
    const isFocused = useIsFocused();

    const { activiyDetails } = route.params || {}
    const [timeDifference, setTimeDifference] = useState('');
    const [date, setDate] = useState(null);

    useEffect(() => {
        const date = new Date();
        const todayDate = formatDate(date);
        setDate(todayDate);
    }, []);

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

    if (!isFocused) return null; 

    return (
        <CustomContainer>
            <CustomHeader title="ATP Login" onBackPress={() => navigation.goBack()} />
            <CustomContent>
                {activiyDetails.activity_Id === null&&
                <View style={styles.dateCard}>
                    <Text style={[st.tx14, st.txAlignC]}>
                        <Text style={{ color: colors.blue }}>{date}</Text>
                    </Text>
                    <View>
                    {(!attendance?.loginTime || (attendance?.loginTime && logoutDetails?.logoutTime)) ? (
                        <CustomButton title='LOG IN'
                            onPress={() => navigation.navigate('LoginMap', { activiyDetails })}
                        />
                    ) : (
                        <View style={styles.content_logout}>
                            <TouchableOpacity disabled={(attendance?.loginTime && activiyDetails.activity_Id === null) ? true : false}
                                style={[styles.logoutcontainer, {
                                    backgroundColor: (attendance?.loginTime && activiyDetails.activity_Id === null) ? colors.black : colors.blue
                                }]}
                                onPress={() => navigation.navigate('LoginMap', { activiyDetails })}>
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
                    {(attendance?.loginTime && activiyDetails.activity_Id === null) &&
                        <View style={st.mt_5}>
                            <Text style={[st.tx12, { color: '#ccc' }]}>The Logout button will be enabled once the activity form is filled and submitted successfully</Text>
                        </View>}

                    {(activiyDetails.activity_Id == null && attendance?.loginTime) && (
                        <CustomButton title='Proceed to fill activity form'
                            onPress={() => navigation.navigate('ATPForm', { activiyDetails })}
                        />)}

                </View>
                }
                 
                <View style={styles.detailCard}>
                    <Text style={styles.title}>{activiyDetails.visit_Purpose}</Text>
                    <Field label="Visit Start Date and Time" value={activiyDetails.visit_Start_Date} />
                    <Field label="Visit End Date and Time" value={activiyDetails.visit_End_Date} />
                    <Field label="Block" value={activiyDetails.blockNameE} />
                    <Field label="ASHA Facilitator (AF)" value={activiyDetails.ashaSahyogi_Name} />
                    <Field label="ASHA Name" value={activiyDetails.ashaNameEnglish} />
                    <Field label="Village" value={activiyDetails.villageName} />
                    <Field label="Other Activity" value={activiyDetails.other_Activity} />
                    <Field label="Duration" value={activiyDetails.duration} />
                </View>
                {activiyDetails.activity_DateTime &&
                    <View style={styles.detailCard}>
                        <Text style={styles.title}>Activity Details</Text>
                        <Field label="Entry Date and Time" value={activiyDetails.activity_DateTime} />
                        <Field label="Entry End Date and Time" value={activiyDetails.visit_Completion} />
                        <Field label="Planned Activity" value={activiyDetails.planned_Activity} />
                        <Field label="Other Planned Activity" value={activiyDetails.other_Activity} />
                        <Field label="Meeting Participants" value={activiyDetails.meeting_Participant} />
                        <Field label="Other Meeting Participants" value={activiyDetails.other_MeetingParticipant} />
                        <Field label="Activity Details" value={activiyDetails.activity_Details} />
                        <Field label="Image" value={activiyDetails.photo_Path} />
                        <Image source={{ uri: environment.imageUrl + activiyDetails.photo_Path }} style={st.imageSty} />
                        <Field label="Video" value={activiyDetails.video_Path} />
                        <Video source={{ uri: environment.imageUrl + activiyDetails.video_Path}}
                            controls
                            paused={!isFocused}
                            style={st.imageSty} />
                    </View>
                }
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