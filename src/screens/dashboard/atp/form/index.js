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

const INITIALINPUT = {
  date: '',
  time: '',
  planedActivity: '',
  meetings: [],
  other: '',
  activityDetails: '',
  visitCompletion: '',
  other_Activity: '',
  visit_Purpose: ''
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

  const { location, error, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();
  const { atP_Id } = route.params;

  const activiyDetails = useSelector(
    state => state.activityPlan.data.find(item => item.atP_Id == atP_Id)
  );

  const dispatch = useDispatch()
  const userLogin = useSelector(state => state.login.data);

  useEffect(() => {
    setInputs({
      ...inputs,
      planedActivity: activiyDetails?.visit_PurposeId_Id,
      visit_Purpose: activiyDetails?.visit_Purpose,
      other_Activity: activiyDetails?.other_Activity
    })
  }, [activiyDetails])

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

  const uploadProfileToServer = async res => {
    setAttachmentErr('')
    setAttachment(res);
  };

  const uploadVideoToServer = async res => {
    setAttachedVideoErr('')
    setAttachedVideo(res);
  };

  const AvatarPicker = WithImageUpload(
    ({ handleMediaUpload, ...props }) => (
      <View>
        <Text style={st.tx12}>Photo Capture *</Text>
        <Pressable
          onPress={handleMediaUpload}
          {...props}>
          <View style={[st.photoContainer, { borderColor: attachmentErr ? colors.red : 'rgba(200, 200, 200, 1)' }]}>

            {attachment ?
              <Image source={{ uri: attachment?.uri }} style={st.imageSty}
                resizeMode='cover'
              />
              :
              <View style={st.center}>
                <Icon name={'camera'} size={20} color={colors.lightGrey} />
                <Text style={[st.tx12, { color: colors.lightGrey }]}>Tap to Capture Photo</Text>
              </View>
            }
          </View>
        </Pressable>

        {attachmentErr && <Text style={st.error}>{attachmentErr}</Text>}

      </View>
    ),
    uploadProfileToServer,
    'image'
  );

  const VideoPicker = WithImageUpload(
    ({ handleMediaUpload, props }) => (
      <View>
        <Text style={st.tx12} numberOfLines={1} adjustsFontSizeToFit>Video Capture (max 30 sec) *</Text>
        <Pressable
          onPress={handleMediaUpload}
          {...props}>
          <View style={[st.photoContainer, { borderColor: attachedVideoErr ? colors.red : 'rgba(200, 200, 200, 1)' }]}>
            {attachedVideo ?
              <Video source={{ uri: attachedVideo?.uri }}
                controls
                style={st.imageSty} />
              :
              <View style={st.center}>
                <Icon name={'camera'} size={20} color={colors.lightGrey} />
                <Text style={[st.tx12, { color: colors.lightGrey }]}>Tap to Capture Video</Text>
              </View>
            }
          </View>
        </Pressable>

        {attachedVideoErr && <Text style={st.error}>{attachedVideoErr}</Text>}

      </View>
    ),
    uploadVideoToServer,
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
      setIsLoading(false);   // 🔥 important
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
      clientId: generateclientID(userLogin.userId)
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

  return (
    <CustomContainer>
      <CustomHeader title="Field activity form" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <CustomContent>

          <View style={st.flex}>
            <CustomDatePicker
              label="Entry Date *"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('date', 'date')}
            />

            <CustomDatePicker
              label="Entry Time *"
              placeholder=""
              iconName={'clock'}
              {...dateFieldProps('time', 'time')}
            />

            <MyInput label="Planned Activity"
              {...fieldProps('visit_Purpose')}
              disabled={true}
            />

            {inputs?.other_Activity &&
              <MyInput label="Other Activity *" {...fieldProps('other_Activity')} disabled={true} />
            }
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
                <AvatarPicker />

              </View>
              <View style={[st.wdh48, { marginLeft: "2%" }]}>
                <VideoPicker />
              </View>
            </View>

            <CustomButton title='Save'
              onPress={onSave}
              disabled={isLoading}
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