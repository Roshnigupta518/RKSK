import { StyleSheet, Text, View, Pressable, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import MyInput from '../../../../components/customInput';
import CustomButton from '../../../../components/customButton';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import { family, colors } from '../../../../global';
import st from '../../../../global/styles';
import Icon from 'react-native-vector-icons/Feather'
import { isEmpty } from '../../../../utils/validations';
import WithImageUpload from '../../../../HOC/ImageUploader';
import { useLocation } from '../../../../hooks/useLocation';
import Video from 'react-native-video';
import CustomMultiSelect from '../../../../components/customMultiselect';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import { updateActivityPlanItem } from '../../../../redux/slices/ActivityPlan';
import { addToQueue } from '../../../../redux/slices/queueSlice';
import { reStartBackgroundService } from '../../../../utils/bgservices/backgroundService';
import { syncTaskName } from '../../../../utils/bgservices/backgroundTaskEnum';
import { generateclientID } from '../../../../utils/helper';
import CustomPicker from '../../../../components/customPicker';

const INITIALINPUT = {
  date: '',
  time: '',
  planedActivity: '',
  meetings: [],
  other: '',
  activityDetails: '',
  visitCompletion: '',
  other_Activity: '',
  visit_Purpose: '',
  selectedSubActivity: '',
  other_subActivity: ''
};

const errMsg = 'This field is required'

const ATPForm = ({ navigation, route }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachedVideo, setAttachedVideo] = useState(null)
  const [attachmentErr, setAttachmentErr] = useState();
  const [attachedVideoErr, setAttachedVideoErr] = useState();
  const [subActivity, setSubActivity] = useState([])
  const [paused, setPaused] = React.useState(true);

  const { location, error, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();
  const { atP_Id } = route.params;

  const activiyDetails = useSelector(
    state => state.activityPlan.data.find(item => item.atP_Id == atP_Id)
  );

  console.log({ activiyDetails })

  const dispatch = useDispatch()
  const userLogin = useSelector(state => state.login.data);

  useEffect(() => {
    if (activiyDetails) {
        setInputs({
        ...inputs,
        planedActivity: activiyDetails?.visit_PurposeId_Id,
        visit_Purpose: activiyDetails?.visit_Purpose,
        other_Activity: activiyDetails?.other_Activity,
      });
      
      // 1️⃣ Identify FILLED subactivities
      const filledSubs =
        activiyDetails?.subacitivity
          ?.filter(item =>
            item.photo_Path &&
            item.video_Path &&
            item.meeting_Participant &&
            item.activity_Details &&
            item.activity_DateTime &&
            item.visit_Completion,
          )
          ?.map(item => item.name) || [];
  
      // 2️⃣ Convert subActivities into dropdown format
      let tempSubAct =
        activiyDetails?.subacitivity?.map(item => ({
          label: item.name,
          value: item.name,
        })) || [];
  
      // 3️⃣ Remove FILLED subactivities from dropdown
      tempSubAct = tempSubAct.filter(
        item => !filledSubs.includes(item.value)
      );
  
      // 4️⃣ Always include "Other" if not already filled
      const isOtherFilled = filledSubs.includes("Other");
      if (!isOtherFilled) {
        const exists = tempSubAct.some(i => i.value === "Other");
        if (!exists) {
          tempSubAct.push({ label: "Other", value: "Other" });
        }
      }
       console.log({tempSubAct})
      setSubActivity(tempSubAct);
    }
  }, [activiyDetails]);  

  const handleOnchange = useCallback(
    (field) => (value) => {
      setInputs((prev) => {
        let updated = { ...prev, [field]: value };
        return updated;
      });
    },
    []
  );
  
  const handleError = useCallback((errorMsg, field) => {
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  }, []);

  const fieldProps = (field) => ({
    value: inputs[field],
    error: errors[field],
    onChangeText: (value) => {
      handleOnchange(field)(value);
      if (errors[field]) handleError('', field);
    },
    onFocus: () => {
      if (errors[field]) handleError('', field);
    },
    disabled: isLoading,
  });

  const dateFieldProps = (field, mode = 'date') => ({
    value: inputs[field] ? new Date(inputs[field]) : new Date(),
    error: errors[field],
    mode,
    onChange: (val) => {
      // ✅ store as ISO string to preserve the actual time
      handleOnchange(field)(val.toISOString());
      if (errors[field]) handleError('', field);
    },
    disabled: isLoading,
  });

  const pickerFieldProps = (field) => ({
    selectedValue: inputs[field],
    error: errors[field],
    onValueChange: (val) => {
      handleOnchange(field)(val);
      handleError('', field);
  
      // ✅ Other se kisi aur pe gaye to text clear
      if (val !== 'Other') {
        handleOnchange('other_subActivity')('');
        handleError('', 'other_subActivity');
      }
    },
    disabled: isLoading,
  });
  
  const uploadProfileToServer = async res => {
    setAttachmentErr('')
    setAttachment(res);
  };

  const uploadVideoToServer = async res => {
    setAttachedVideoErr('')
    setAttachedVideo(res);
  };

  const AvatarPicker = WithImageUpload(
    ({ handleMediaUpload, value, error }) => (
      <View>
        <Text style={st.tx12}>Photo Capture *</Text>

        <Pressable onPress={handleMediaUpload}>
          <View style={[st.photoContainer, { borderColor: error ? colors.red : '#ccc' }]}>
            {value ? (
              <Image source={{ uri: value.uri }} style={st.imageSty} />
            ) : (
              <View style={st.center}>
                <Icon name={'camera'} size={20} color={colors.lightGrey} />
                <Text style={[st.tx12, { color: colors.lightGrey }]}>Tap to Capture Photo</Text>
              </View>
            )}
          </View>
        </Pressable>

        {error && <Text style={st.error}>{error}</Text>}
      </View>
    ),
    'image'
  );

  const VideoPicker = WithImageUpload(
    ({ handleMediaUpload, value, error }) => (
      <View>
        <Text style={st.tx12} numberOfLines={1}>Video Capture(max 30 sec) *</Text>

        <Pressable onPress={handleMediaUpload}>
          <View style={[st.photoContainer, { borderColor: error ? colors.red : '#ccc' }]}>
            {value ? (
              <Video source={{ uri: value.uri }} 
              style={st.imageSty} 
              controls 
              paused={paused}
              />
            ) : (
              <View style={st.center}>
                <Icon name={'camera'} size={20} color={colors.lightGrey} />
                <Text style={[st.tx12, { color: colors.lightGrey }]}>Tap to Capture Video</Text>
              </View>
            )}
          </View>
        </Pressable>

        {error && <Text style={st.error}>{error}</Text>}
      </View>
    ),
    'video'
  );

  const validateForm = () => {
    let valid = true;
    console.log({ inputs })
    let tempErrors = { ...INITIALINPUT };

    if (!inputs.date || isNaN(new Date(inputs.date).getTime())) {
      tempErrors.date = errMsg;
      valid = false;
    }

    if (!inputs.time || isNaN(new Date(inputs.time).getTime())) {
      tempErrors.time = errMsg;
      valid = false;
    }

    if (isEmpty(inputs.planedActivity)) {
      tempErrors.planedActivity = errMsg;
      valid = false;
    }

    if (!inputs.meetings || inputs.meetings.length === 0) {
      tempErrors.meetings = errMsg;
      valid = false;
    }

    if (inputs.meetings.includes('Other') && isEmpty(inputs.other)) {
      tempErrors.other = errMsg;
      valid = false;
    }

    if (isEmpty(inputs.activityDetails)) {
      tempErrors.activityDetails = errMsg;
      valid = false;
    }

    if (inputs.meetings === 3 && isEmpty(inputs.other)) {
      tempErrors.other = errMsg;
      valid = false;
    }

    if (!attachment) {
      setAttachmentErr(errMsg);
      valid = false;
    } else {
      setAttachmentErr('');
    }

    if (!attachedVideo) {
      setAttachedVideoErr(errMsg);
      valid = false;
    } else {
      setAttachedVideoErr('');
    }

    // ✅ Activity picker required jab planedActivity == 2 ho
    if (inputs.planedActivity == 2 && isEmpty(inputs.selectedSubActivity)) {
      tempErrors.selectedSubActivity = errMsg;
      valid = false;
    }

    // ✅ Agar Activity me "Other" select hai → input bhi required
    if (
      inputs.planedActivity == 2 &&
      inputs.selectedSubActivity === 'Other' &&
      isEmpty(inputs.other_subActivity)
    ) {
      tempErrors.other_subActivity = errMsg;
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  const locationHandle = () => {
    if (error == 'gps-off') {
      Alert.alert(
        'Location Required',
        'Location permission is required to submit the form. Please enable location access in your device settings.',
        [
          {
            text: 'OK',
            onPress: async () => {
              openLocationSettings();
            },
          },
        ]
      );

    } else if (error == 'permissionDenied') {
      permissionHandle()
    }
  }

  const onSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true)

    const isValid = validateForm();
    if (!isValid) {
      setIsLoading(false);  
      return;
    }

    console.log('Form data is valid:', inputs, attachment, attachedVideo);
    const datePart = moment(inputs.date);
    const timePart = moment(inputs.time);

    const combined = moment(datePart)
      .set({
        hour: timePart.hour(),
        minute: timePart.minute(),
        second: timePart.second(),
      });

    const ActivityDateTime = combined.format('YYYY-MM-DD HH:mm:ss');

    if (!location?.latitude && !location?.longitude) {
      locationHandle();
      setIsLoading(false);   // 🔥 important
      return;
    }

   // 👇 Get existing subacitivity array (preserve others)
  const existingSubs = activiyDetails?.subacitivity || [];

  // 👇 Create subactivity array only if visit_Purpose == 2
  let subactivityArray = [...existingSubs];  // Start with existing to preserve unfilled ones

    if (inputs.planedActivity == 2) {

      let subObj = {
        name: inputs.selectedSubActivity,           // Always store selected name
        photo_Path: attachment,
        video_Path: attachedVideo,
        meeting_Participant: inputs.meetings?.toString(),
        activity_Details: inputs.activityDetails,
        other_MeetingParticipant: inputs.other,
        latitude: location.latitude,
        longititude: location.longitude,
        subacitivity_Id: generateclientID(userLogin.userId),
      };

      // If selected subactivity is OTHER → add this extra key
      if (inputs.selectedSubActivity === "Other") {
        subObj.SubActivity_Other = inputs.other_subActivity;   // <-- ADD
      }

      // If Meeting Participant includes Other
      if (inputs.meetings?.includes("Other")) {
        subObj.other_MeetingParticipant = inputs.other;        // <-- Already correct
      }

      // 🔥 MERGE LOGIC: Update existing or append new
        const selectedIndex = existingSubs.findIndex(sub => sub.name?.trim() == inputs.selectedSubActivity?.trim());
        console.log({selectedIndex})
        if (selectedIndex !== -1) {
          // Update existing subactivity (e.g., Activity1)
          subactivityArray[selectedIndex] = { 
            ...existingSubs[selectedIndex],  // Preserve any other fields if needed
            ...subObj 
          };
        } else {
          // Append new (e.g., "Other" if not exists)
          subactivityArray.push(subObj);
        }
    }

    const params = {
      activity_DateTime: ActivityDateTime,
      activity_Details: inputs.activityDetails,
      Address: locationArea,
      Latitude: location.latitude,
      Longitude: location.longitude,
      meeting_Participant: inputs.meetings?.toString(),
      other_MeetingParticipant: inputs.other,
      photo_Path: attachment,
      PlannedActivity: inputs.planedActivity,
      video_Path: attachedVideo,
      visit_Completion: moment().format('YYYY-MM-DD HH:mm:ss'),
      other_Activity: inputs.other_Activity,
      CreatedBy: userLogin.userId,
      clientId: generateclientID(userLogin.userId),
      selectedSubActivity: inputs.selectedSubActivity,
      Subactivity_Other: inputs.other_subActivity,
      // ADD THIS
      subacitivity: subactivityArray
    }

    dispatch(updateActivityPlanItem({
      atP_Id: activiyDetails.atP_Id,
      newData: params
    }));

    dispatch(addToQueue({
      type: "FORM",
      payload: {
        atP_Id: activiyDetails.atP_Id,
        ...params
      }
    }));

    await reStartBackgroundService(syncTaskName.syncAcitivityQueue);

    navigation.reset({
      index: 0,
      routes: [{ name: 'ATPLogin', params: { atP_Id: activiyDetails.atP_Id }, }],
    });

    setIsLoading(false)
  };

  const handleMeetingChange = useCallback((val) => {
    Keyboard.dismiss();
    setInputs((prev) => ({
      ...prev,
      meetings: val,
      other: val.includes('Other') ? prev.other : '',
    }));

    // ✅ error clear jab user koi item select kare
    if (val.length > 0) {
      handleError('', 'meetings');
    }

  }, []);

  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      date: prev.date || new Date().toISOString(),
      time: prev.time || new Date().toISOString(),
    }));
  }, []);

  const isClockedIn = !!activiyDetails?.clockinTime;

  return (
    <CustomContainer>
      <CustomHeader title="Field activity form" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps='handled'
        >
        <CustomContent>

        {!isClockedIn && (
          <Text style={st.error}>
            Please complete Clock-In before submitting the form
          </Text>
        )}

          <View style={st.flex}>
            <CustomDatePicker
              label="Entry Date *"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('date', 'date')}
              disabled={true}
            />

            <CustomDatePicker
              label="Entry Time *"
              placeholder=""
              iconName={'clock'}
              {...dateFieldProps('time', 'time')}
              disabled={true}
            />

            <MyInput label="Planned Activity"
              {...fieldProps('visit_Purpose')}
              disabled={true}
            />

            {inputs?.other_Activity &&
              <MyInput label="Other Activity *" {...fieldProps('other_Activity')} disabled={true} />
            }

            <View>
              {inputs.planedActivity == 2 ? (

                <CustomPicker
                  items={subActivity}
                  label={'Activity *'}
                  placeholder=''
                  {...pickerFieldProps('selectedSubActivity')}
                />
              ) : null}

              {inputs?.selectedSubActivity === 'Other' &&
                <MyInput label="Other Activity *" {...fieldProps('other_subActivity')} />
              }
            </View>
            <View>
              <CustomMultiSelect
                label="Meeting Participants *"
                items={ParticipantsList}
                selectedItems={inputs.meetings}
                onSelectedItemsChange={handleMeetingChange}
                required
                placeholder=""
                disabled={isLoading}
                error={errors.meetings}
              />

              {inputs.meetings.includes('Other') && (
                <MyInput label="Other *" {...fieldProps('other')} />
              )}

              <MyInput label="Activity Details *" {...fieldProps('activityDetails')} />

              <View style={st.row}>
                <View style={st.wdh48}>
                  <AvatarPicker
                    value={attachment}
                    error={attachmentErr ? 'Required' : ''}
                    onUpload={(res) => {
                      uploadProfileToServer(res)
                    }} />

                </View>
                <View style={[st.wdh48, { marginLeft: "2%" }]}>
                  <VideoPicker
                    value={attachedVideo}
                    error={attachedVideoErr ? 'Required' : ''}
                    onUpload={(res) => {
                      uploadVideoToServer(res)
                    }}
                  />
                </View>
              </View>

            </View>

            <CustomButton title='Save'
              onPress={onSave}
              disabled={isLoading || !isClockedIn}
              loading={isLoading}
            />
          </View>
        </CustomContent>
      </KeyboardAvoidingView>

    </CustomContainer>
  )
}

export default ATPForm

const ParticipantsList = [
  { name: 'Peer Educator', id: 'Peer Educator' },
  { name: 'ASHA', id: 'ASHA' },
  { name: 'Other', id: 'Other' },
]