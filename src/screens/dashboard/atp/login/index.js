import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image, BackHandler
} from 'react-native';
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import CustomButton from '../../../../components/customButton';
import st from '../../../../global/styles';
import { colors } from '../../../../global';
import Field from '../../../../components/field';
import { timeDifferenceFun, formatTime, formatDate,formatClockInDisplay, parseAnyDate } from '../../../../utils/helper';
import Icon from 'react-native-vector-icons/Feather';
import { environment } from '../../../../utils/constant'
import Video from 'react-native-video';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import FieldRow from '../../../../components/FieldRow';

const ATPDetailScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();

  const { atP_Id } = route.params || {}
  const [timeDifference, setTimeDifference] = useState('');
  const [date, setDate] = useState(null);

  const [showVideo, setShowVideo] = useState(false);

  const activiyDetails = useSelector(
    state => state.activityPlan.data.find(item => item.atP_Id == atP_Id)
  );

  const isFormFilled = activiyDetails.activity_Id || activiyDetails.clientId;

  // console.log({activiyDetails})

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp', state: { routes: [{ name: 'ATPListScreen' }] } }],
        });
        return true; // default back रोक देता है
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );


  useEffect(() => {
    let timeout;
    if (isFocused) {
      timeout = setTimeout(() => setShowVideo(true), 300);
    } else {
      setShowVideo(false);
    }
    return () => clearTimeout(timeout);
  }, [isFocused]);

  useEffect(() => {
    const date = new Date();
    const todayDate = formatDate(date);
    setDate(todayDate);
  }, []);

  useEffect(() => {
    if (activiyDetails.clockinTime) {
      const storedTime = parseAnyDate(activiyDetails?.clockinTime);

      const interval = setInterval(() => {
        const difference = timeDifferenceFun(
          storedTime,
          activiyDetails?.clockoutTime,
        );
        setTimeDifference(difference);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activiyDetails]);

  return (
    <CustomContainer>
      <CustomHeader title="ATP Login"
        onBackPress={() => navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp', state: { routes: [{ name: 'ATPListScreen' }] } }],
        })} />
      <CustomContent>

        {!(activiyDetails.clockinTime && activiyDetails.clockoutTime && activiyDetails.activity_Id) && (
          <View style={styles.dateCard}>
            <Text style={[st.tx14, st.txAlignC]}>
              <Text style={{ color: colors.blue }}>{date}</Text>
            </Text>

            {/* CASE 1: Show CLOCK IN */}
            {!activiyDetails.clockinTime && (
              <CustomButton
                title="Clock In"
                onPress={() => navigation.navigate("LoginMap", { activiyDetails })}
              />
            )}

            {/* CASES where clockinTime exists */}
            {activiyDetails.clockinTime && (
              <View>

                {/* CASE 4: Clockout Done → Hide All */}
                {activiyDetails.clockoutTime ? null : (
                  <>
                    {/* CASE 2 + CASE 3 → Show Clock Out + Timer */}
                    <View style={styles.content_logout}>
                      <TouchableOpacity
                        disabled={!isFormFilled}   // Disable if form not submitted
                        style={[
                          styles.logoutcontainer,
                          {
                            backgroundColor:
                              !isFormFilled
                                ? colors.black        // Disabled color
                                : colors.blue         // Enabled color
                          }
                        ]}
                        onPress={() =>
                          navigation.navigate("LoginMap", { activiyDetails })
                        }
                      >
                        <Text style={[st.tx16, { color: colors.white }]}>Clock Out</Text>
                      </TouchableOpacity>

                      <View style={st.wdh50}>
                        <View style={st.center}>
                          <Text style={st.tx12}>{timeDifference}</Text>

                          <View style={[st.row, st.align_C]}>
                            <Icon
                              name={"arrow-down-left"}
                              size={20}
                              color={colors.success}
                            />
                            <Text style={[st.tx12, { color: colors.grey }]}>
                              {formatClockInDisplay(activiyDetails?.clockinTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* CASE 2: Clockin done but form not filled → Show message */}
                    {!isFormFilled && (
                      <Text style={[st.tx12, { color: "#ccc", marginTop: 5 }]}>
                        The Clock Out button will be enabled once the activity form is filled and submitted successfully.
                      </Text>
                    )}

                    {/* CASE 2: Proceed Button */}
                    {!isFormFilled && (
                      <CustomButton
                        title="Proceed to fill activity form"
                        onPress={() =>
                          navigation.navigate("ATPForm", { atP_Id })
                        }
                      />
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.detailCard}>
          <Text style={[styles.title, { color: colors.blue }]}>{activiyDetails.visit_Purpose} Activity plan</Text>
          <FieldRow>
            <Field label="Start Date and Time" value={activiyDetails.visit_Start_Date} />
            <Field label="End Date and Time" value={activiyDetails.visit_End_Date} />
          </FieldRow>

          <FieldRow>
            <Field label="Block" value={activiyDetails.blockNameE} />
            <Field label="ASHA Facilitator (AF)" value={activiyDetails.ashaSahyogi_Name} />
          </FieldRow>

          <FieldRow>
            <Field label="ASHA Name" value={activiyDetails.ashaNameEnglish} />
            <Field label="Village" value={activiyDetails.villageName} />
          </FieldRow>

          <FieldRow>
            <Field label="Other Activity" value={activiyDetails.other_Activity} />
            <Field label="Duration" value={activiyDetails.duration} />
          </FieldRow>

        </View>
        {activiyDetails.activity_DateTime &&
          <View style={styles.detailCard}>
            <Text style={styles.title}>Activity Details</Text>
            <FieldRow>
              <Field label="Entry Date and Time" value={activiyDetails.activity_DateTime} />
              <Field label="Entry End Date and Time" value={activiyDetails.visit_Completion} />
            </FieldRow>
            <FieldRow>
              <Field label="Planned Activity" value={activiyDetails.planned_Activity} />
              <Field label="Other Planned Activity" value={activiyDetails.other_Activity} />
            </FieldRow>
            <FieldRow>
              <Field label="Meeting Participants" value={activiyDetails.meeting_Participant} />
              <Field label="Other Meeting Participants" value={activiyDetails.other_MeetingParticipant} />
            </FieldRow>

            <Field label="Activity Details" value={activiyDetails.activity_Details} />

            <View style={st.row}>
              <View style={st.wdh48}>
                <Text style={st.tx12}>Image</Text>
                <Image source={{ uri: environment.imageUrl + (activiyDetails.photo_Path?.uri || activiyDetails.photo_Path) }} style={st.imageSty} />
              </View>
              <View style={[st.wdh48, { marginLeft: '2%' }]}>
                <Text style={st.tx12}>Video</Text>
                {showVideo && activiyDetails.video_Path && (
                  <Video
                    source={{ uri: environment.imageUrl + (activiyDetails.video_Path?.uri || activiyDetails.video_Path) }}
                    controls
                    paused={!isFocused}
                    style={st.imageSty}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
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