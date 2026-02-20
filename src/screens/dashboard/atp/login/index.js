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
import { timeDifferenceFun, formatTime, formatDate, formatClockInDisplay, parseAnyDate } from '../../../../utils/helper';
import Icon from 'react-native-vector-icons/Feather';
import { environment } from '../../../../utils/constant'
import Video from 'react-native-video';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import FieldRow from '../../../../components/FieldRow';
import { getPlanStatus } from '../../../../utils/helper';

const ATPDetailScreen = ({ navigation, route }) => {
  const isFocused = useIsFocused();

  const { atP_Id, filterType } = route.params || {}
  const [timeDifference, setTimeDifference] = useState('');
  const [date, setDate] = useState(null);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [imgError, setImgError] = useState(false)
  const [showVideo, setShowVideo] = useState(false);

  const activiyDetails = useSelector(
    state => state.activityPlan.data.find(item => item.atP_Id == atP_Id)
  );

  const status = getPlanStatus(activiyDetails);

  const navigationAction = () => {
    if (filterType) {
      navigation.navigate('FilteredList', { filterType })
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp', state: { routes: [{ name: 'ATPListScreen' }] } }],
      });
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        navigationAction()
        return true; 
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
      console.log({ activiyDetails, filterType })
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

  let isFormFilled, allCompleted, filledSubs, incompleteSubs;

  if (activiyDetails.visit_PurposeId_Id == 2) {
    // NEW STRICT LOGIC
    const getFilledSubactivities = () => {
      return activiyDetails?.subacitivity?.filter(item => {
        return (
          item.activity_DateTime ||
          item.activity_Details ||
          item.photo_Path ||
          item.video_Path ||
          item.meeting_Participant ||
          item.other_MeetingParticipant
        );
      });
    };

    filledSubs = getFilledSubactivities();
    const totalSubs = activiyDetails?.subacitivity?.length || 0;

    const isMainFormFilled = Boolean(
      activiyDetails.activity_DateTime ||
      activiyDetails.activity_Details ||
      activiyDetails.photo_Path ||
      activiyDetails.video_Path ||
      activiyDetails.meeting_Participant ||
      activiyDetails.other_MeetingParticipant
    );

    isFormFilled = isMainFormFilled || filledSubs.length > 0;

    // 🔥 FIXED: For ID=2, allCompleted based purely on subs (ignore main form)
    allCompleted = filledSubs.length === totalSubs;

    // 🔥 INCOMPLETE SUBACTIVITIES
    incompleteSubs = activiyDetails?.subacitivity?.filter(item => {
      return !(
        item.activity_DateTime ||
        item.activity_Details ||
        item.photo_Path ||
        item.video_Path ||
        item.meeting_Participant ||
        item.other_MeetingParticipant
      );
    });

  } else {
    // OLD LOGIC
    isFormFilled = activiyDetails.activity_Id || activiyDetails.clientId;
    allCompleted = true;
  }

  const imageUri =
    activiyDetails?.photo_Path?.uri
      ? activiyDetails.photo_Path.uri
      : activiyDetails?.photo_Path
        ? environment.imageUrl + activiyDetails.photo_Path
        : null;


  return (
    <CustomContainer>
      <CustomHeader title="Activity Details"
        onBackPress={() => navigationAction()} />
      <CustomContent>

        {status !== "Scheduled" && !(activiyDetails.clockinTime && activiyDetails.clockoutTime) && (
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
                            <View style={st.wdh10}>
                            <Icon
                              name={"arrow-down-left"}
                              size={16}
                              color={colors.success}
                            />
                            </View>
                           <View style={st.wdh90}>
                            <Text style={[st.tx12,st.txAlignC, { color: colors.grey }]} numberOfLines={1} adjustsFontSizeToFit>
                              {formatClockInDisplay(activiyDetails?.clockinTime)}
                            </Text>
                            </View>
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

                    {/* CASE 2: Proceed Button - Updated Condition */}
                    {activiyDetails.visit_PurposeId_Id == 2
                      ? (!allCompleted ? (
                        <CustomButton
                          title="Proceed to fill activity form"
                          onPress={() =>
                            navigation.navigate("ATPForm", { atP_Id })
                          }
                        />
                      ) : null)
                      : (!isFormFilled ? (
                        <CustomButton
                          title="Proceed to fill activity form"
                          onPress={() =>
                            navigation.navigate("ATPForm", { atP_Id })
                          }
                        />
                      ) : null)
                    }
                  </>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.detailCard}>
          <Text style={[styles.title, { color: colors.blue }]}>{activiyDetails.visit_Purpose}</Text>
          <FieldRow>
            <Field label="Atp Id" value={activiyDetails.atP_Id} />
          </FieldRow>

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
            {activiyDetails.visit_PurposeId_Id == 8 && (
              <Field label="Other Activity" value={activiyDetails.other_Activity} />
            )}
            {activiyDetails.visit_PurposeId_Id == 2 && activiyDetails?.subacitivity?.length > 0 && (
              <View style={st.wdh50}>
                <View>
                  <Text style={st.tx12}>Sub Activity</Text>
                </View>
                <View>
                  <Text style={[st.tx12, st.txbold]}>
                    {activiyDetails.subacitivity
                      .map(item => item.name)
                      .join(', ')
                    }
                  </Text>
                </View>
              </View>
            )}
            <Field label="Duration" value={activiyDetails.duration} />
          </FieldRow>
        </View>

        {activiyDetails.activity_DateTime &&
          activiyDetails.visit_PurposeId_Id != 2 ? (
          <View style={styles.detailCard}>
            <Text style={styles.title}>Activity Details</Text>
            <FieldRow>
              <Field label="Entry Date and Time" value={activiyDetails.activity_DateTime} />
              <Field label="Entry End Date and Time" value={activiyDetails.visit_Completion} />
            </FieldRow>
            <FieldRow>
              <Field label="Planned Activity" value={activiyDetails.visit_Purpose} />
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
                {imageUri && !imgError ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={st.imageSty}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={[st.imageSty, st.center]}>
                    <Text style={[st.tx10, { color: colors.black }]}>Image not available</Text>
                  </View>
                )}
              </View>
              <View style={[st.wdh48, { marginLeft: '2%' }]}>
                <Text style={st.tx12}>Video</Text>
                {showVideo && activiyDetails.video_Path && (
                  <View>
                    <Video
                      source={{ uri: activiyDetails.video_Path?.uri ? activiyDetails.video_Path?.uri : environment.imageUrl + activiyDetails.video_Path  }}
                      controls
                      paused={isVideoPaused}
                      style={st.imageSty}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        ) :
          <View>
            {filledSubs?.length > 0 &&
              filledSubs?.map((item, index) => {
                return (
                  <View key={index}>
                    <View style={styles.detailCard}>
                      {/* <Text style={styles.title}>{item.name}</Text> */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.title}>{item.name}</Text>

                        {item.isSynced ? (
                          <Icon
                            name="check-circle"
                            size={18}
                            color={colors.green}   // green
                          />
                        ) : (
                          <Icon
                            name="refresh-cw"
                            size={18}
                            color={colors.yellow}      // orange
                          />
                        )}
                      </View>

                      <FieldRow>
                        <Field label="Entry Date and Time" value={item.activity_DateTime} />
                        <Field label="Entry End Date and Time" value={item.visit_Completion} />
                      </FieldRow>

                      <FieldRow>
                        <Field label="Meeting Participants" value={item.meeting_Participant} />
                        <Field label="Other Meeting Participants" value={item.other_MeetingParticipant} />
                      </FieldRow>

                      <Field label="Activity Details" value={item.activity_Details} />

                      <View style={st.row}>
                        <View style={st.wdh48}>
                          <Text style={st.tx12}>Image</Text>
                          <Image source={{ uri: item.photo_Path?.uri ? item.photo_Path?.uri : environment.imageUrl+item.photo_Path  }} style={st.imageSty} />
                        </View>
                        <View style={[st.wdh48, { marginLeft: '2%' }]}>
                          <Text style={st.tx12}>Video</Text>
                          {showVideo && item.video_Path && (
                            <View>
                              <Video
                                // source={{ uri: environment.imageUrl + (item.video_Path?.uri || item.video_Path) }}
                                source={{uri: item.video_Path?.uri ? item.video_Path?.uri : environment.imageUrl+item.video_Path }}
                                controls
                                paused={isVideoPaused}
                                style={st.imageSty}
                                resizeMode="cover"
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            }
          </View>
        }

        {activiyDetails.clockinTime && activiyDetails.clockoutTime && !allCompleted && (
          <View style={st.card}>

            <Text style={[st.tx14, st.txbold, { color: colors.blue }]}>Incomplete Activities</Text>

            <View style={st.warningBox}>
              <Icon name="alert-circle" size={16} color="#E59E0B" />
              <Text style={st.tx12}>
                {"  The following activities remain incomplete."}
              </Text>
            </View>

            {incompleteSubs.map((item, index) => (
              <View>
                <Text style={st.tx14}>{index + 1}. {item.name}</Text>
                {index !== incompleteSubs.length - 1 && (
                  <View style={st.bordersty} />
                )}
              </View>
            ))}
          </View>
        )}

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