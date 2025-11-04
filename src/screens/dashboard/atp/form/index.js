import { StyleSheet, Text, View, Pressable, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import MyInput from '../../../../components/customInput';
import CustomButton from '../../../../components/customButton';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import CustomPicker from '../../../../components/customPicker';
import { family, colors } from '../../../../global';
import st from '../../../../global/styles';
import Icon from 'react-native-vector-icons/Feather'
import { convertToLabelValue, getPickerImageResp } from '../../../../utils/helper';
import { isEmpty } from '../../../../utils/validations';
import WithImageUpload from '../../../../HOC/ImageUploader';
import { useLocation } from '../../../../hooks/useLocation';
import { atpFormRequest, getATPListRequest } from '../../../../utils/services';
import Video from 'react-native-video';
import CustomMultiSelect from '../../../../components/customMultiselect';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import { clearClock } from '../../../../redux/slices/ClockTime';

const INITIALINPUT = {
  date: '',
  time: '',
  planedActivity: '',
  meetings: [],
  other: '',
  activityDetails: '',
  visitCompletion: '',
  other_Activity: ''
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
  const [data, setData] = useState([])

  const { location, locationArea } = useLocation()
  const { activiyDetails } = route.params || {}

  const userLogin = useSelector(state => state.login.data);
  const dispatch = useDispatch()

  console.log({ userLogin })

  useEffect(() => {
    setInputs({
      ...inputs,
      planedActivity: activiyDetails.visit_PurposeId_Id,
      other_Activity: activiyDetails.other_Activity
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

  const pickerFieldProps = (field) => ({
    selectedValue: inputs[field],
    error: errors[field],
    onValueChange: (val) => {
      handleOnchange(field)(val);
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
        <Text style={st.tx12}>Photo Capture</Text>
        <Pressable
          onPress={handleMediaUpload}
          {...props}>
          <View style={[st.inputContainer, { borderColor: attachmentErr ? colors.red : 'rgba(200, 200, 200, 1)' }]}>
            <View style={st.wdh90}>
              <Text style={st.tx12}>{attachment?.name}</Text>
            </View>
            <View style={st.iconLeft}>
              <Icon name={'camera'} size={20} />
            </View>
          </View>
        </Pressable>
        {attachment &&
          <View style={st.row}>
            <Image source={{ uri: attachment?.uri }} style={st.imageSty} resizeMode='contain' />
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Icon name={'x'} size={20} />
            </TouchableOpacity>
          </View>}
        {attachmentErr && <Text style={st.error}>{attachmentErr}</Text>}

      </View>
    ),
    uploadProfileToServer,
    'image'
  );

  const VideoPicker = WithImageUpload(
    ({ handleMediaUpload, props }) => (
      <View>
        <Text style={st.tx12}>Video Capture</Text>
        <Pressable
          onPress={handleMediaUpload}
          {...props}>
          <View style={[st.inputContainer, { borderColor: attachedVideoErr ? colors.red : 'rgba(200, 200, 200, 1)' }]}>
            <View style={st.wdh90}>
              <Text style={st.tx12}>{attachedVideo?.name}</Text>
            </View>
            <View style={st.iconLeft}>
              <Icon name={'camera'} size={20} />
            </View>
          </View>
        </Pressable>

        {attachedVideo &&
          <View style={st.row}>
            <Video source={{ uri: attachedVideo?.uri }}
              controls
              style={st.imageSty} />
            <TouchableOpacity onPress={() => setAttachedVideo(null)}>
              <Icon name={'x'} size={20} />
            </TouchableOpacity>
          </View>}
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

  const onSave = async () => {
    const isValid = validateForm();
    if (!isValid) return;

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

    try {
      setIsLoading(true);

      const formdata = new FormData();
      formdata.append("ATP_Id", activiyDetails.atP_Id);
      formdata.append("ActivityDateTime", ActivityDateTime);
      formdata.append("ActivityDetails", inputs.activityDetails);
      formdata.append("Address", locationArea);
      formdata.append("Latitude", location.latitude);
      formdata.append("Longitude", location.longitude);
      formdata.append("MeetingParticipant", inputs.meetings?.toString());
      formdata.append("Other_MeetingParticipant", inputs.other);
      formdata.append("Photo", attachment);
      formdata.append("PlannedActivity", inputs.planedActivity);
      formdata.append("Video", attachedVideo);
      formdata.append("VisitCompletion", moment().format('YYYY-MM-DD HH:mm:ss'));
      formdata.append("Other_Activity", inputs.other_Activity);
      formdata.append("CreatedBy", userLogin.userId);

      const result = await atpFormRequest(formdata);
      console.log('ATP FORM Result:', result);
      if (result) {
        Toast.show({
          type: "myCustomType",
          text1: "Success",
          text2: result.message,
          props: { key: 'success' },
          position: 'bottom',
          bottomOffset: 60,
        });
        navigation.navigate('MainApp', { refresh: true })
        dispatch(clearClock())
      } else {
        console.warn('Unexpected data format:', result);
      }
    } catch (e) {
      console.log('ATP_FORM', e)
    } finally {
      setIsLoading(false);
    }
  };

  const getATPDataHandle = async () => {
    try {
      setIsLoading(true);
      const result = await getATPListRequest();
      console.log('ATP Result:', result);
      if (Array.isArray(result)) {
        const tempData = convertToLabelValue(result, 'visit_Purpose', 'visit_PurposeId_Id')
        console.log({ tempData })
        setData(tempData);
      } else {
        console.warn('Unexpected data format:', result);
        setData([]);
      }
    } catch (e) {
      console.log('ATP_LIST', e)
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeetingChange = useCallback((val) => {
    Keyboard.dismiss();
    setInputs((prev) => ({
      ...prev,
      meetings: val,
      other: val.includes('Other') ? prev.other : '',
    }));
  }, []);


  useEffect(() => {
    getATPDataHandle()
  }, [])

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
              label="Entry Date"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('date', 'date')}
            />

            <CustomDatePicker
              label="Entry Time"
              placeholder=""
              iconName={'clock'}
              {...dateFieldProps('time', 'time')}
            />

            <CustomPicker
              label="Planned Activity"
              items={data || []}
              placeholder=""
              fontFamily={family.regular}
              {...pickerFieldProps('planedActivity')}
              disabled={true}
            />

            {inputs?.other_Activity &&
              <MyInput label="Other Activity" {...fieldProps('other_Activity')} disabled={true} />
            }
            <CustomMultiSelect
              label="Meeting Participants"
              items={ParticipantsList}
              selectedItems={inputs.meetings}
              onSelectedItemsChange={handleMeetingChange}
              required
              placeholder=""
              disabled={isLoading}
              error={errors.meetings}
            />

            {inputs.meetings.includes('Other') && (
              <MyInput label="Other" {...fieldProps('other')} />
            )}

            <MyInput label="Activity Details" {...fieldProps('activityDetails')} />

            <AvatarPicker />
            <VideoPicker />

            <CustomButton title='Save'
              onPress={onSave}
              disabled={isLoading}
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