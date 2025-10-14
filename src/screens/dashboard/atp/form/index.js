import { StyleSheet, Text, View, Pressable } from 'react-native'
import React, { useState, useCallback } from 'react'
import CustomHeader from '../../../../components/customHeader';
import { CustomContainer, CustomContent } from '../../../../components/container';
import MyInput from '../../../../components/customInput';
import CustomButton from '../../../../components/customButton';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import CustomPicker from '../../../../components/customPicker';
import { family, colors } from '../../../../global';
import st from '../../../../global/styles';
import Icon from 'react-native-vector-icons/Feather'
import { getPickerImageResp } from '../../../../utils/helper';
import { isEmpty } from '../../../../utils/validations';
import WithImageUpload from '../../../../HOC/ImageUploader';

const INITIALINPUT = {
  dateTime:'',
  planedActivity:'',
  meetings:'',
  activityDetails : '',
  visitCompletion : ''
};

const errMsg = 'This field is required'

const ATPForm = ({ navigation }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachedVideo, setAttachedVideo] = useState(null)
  const [attachmentErr, setAttachmentErr] = useState();
  const [attachedVideoErr, setAttachedVideoErr] = useState();

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
      if (errors[field]) handleError('', field); // clear error while typing
    },
    onFocus: () => {
      if (errors[field]) handleError('', field); // clear error on focus
    },
    disabled: isLoading,
  });
  

  const dateFieldProps = (field) => ({
    value: inputs[field] ? new Date(inputs[field]) : null,
    error: errors[field],
    onChange: (val) => {
      const isoDate = new Date(val).toISOString();
      handleOnchange(field)(isoDate);
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
    const imageResp = getPickerImageResp(res);
    setAttachment(imageResp);
  };

  const uploadVideoToServer = async res => {
    setAttachmentErr('')
    const imageResp = getPickerImageResp(res);
    setAttachedVideo(imageResp);
  };

  const AvatarPicker = WithImageUpload(
    ({ handleMediaUpload, ...props }) => (
      <View>
      <Text style={st.tx12}>Photo Capture</Text>
      <Pressable
        onPress={handleMediaUpload}
        {...props}>
        <View style={[st.inputContainer,{borderColor:attachmentErr?colors.red:'rgba(200, 200, 200, 1)'}]}>
        <Text style={st.tx12}>{attachment?.fileName}</Text>
          <View style={st.iconLeft}>
            <Icon name={'camera'} size={20} />
          </View>
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
      <Text style={st.tx12}>Video Capture</Text>
      <Pressable
        onPress={handleMediaUpload}
        {...props}>
        <View style={[st.inputContainer,{borderColor: attachedVideoErr ?colors.red:'rgba(200, 200, 200, 1)'}]}>
          <Text style={st.tx12}>{attachedVideo?.fileName}</Text>
          <View style={st.iconLeft}>
            <Icon name={'camera'} size={20} />
          </View>
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
  
    // Temporary object to collect errors
    let tempErrors = { ...INITIALINPUT };
  
    // Date validation
    if (isEmpty(inputs.dateTime)) {
      tempErrors.dateTime = errMsg;
      valid = false;
    }
  
    // Planned activity validation
    if (isEmpty(inputs.planedActivity)) {
      tempErrors.planedActivity = errMsg;
      valid = false;
    }
  
    // Meetings validation
    if (isEmpty(inputs.meetings)) {
      tempErrors.meetings = errMsg;
      valid = false;
    }
  
    // Activity details validation
    if (isEmpty(inputs.activityDetails)) {
      tempErrors.activityDetails = errMsg;
      valid = false;
    }
  
    // Photo validation
    if (!attachment) {
      setAttachmentErr(errMsg);
      valid = false;
    } else {
      setAttachmentErr('');
    }
  
    // Video validation
    if (!attachedVideo) {
      setAttachedVideoErr(errMsg);
      valid = false;
    } else {
      setAttachedVideoErr('');
    }
  
    // Visit completion validation
    if (isEmpty(inputs.visitCompletion)) {
      tempErrors.visitCompletion = errMsg;
      valid = false;
    }
  
    setErrors(tempErrors);
    return valid;
  };

  const onSave = () => {
    const isValid = validateForm();
    if (!isValid) return;
  
    // ✅ proceed to save form here
    console.log('Form data is valid:', inputs, attachment, attachedVideo);
  };
  
  
  return (
    <CustomContainer>
      <CustomHeader title="Field activity form" onBackPress={() => navigation.goBack()} />
      <CustomContent>
        <View>
          <CustomDatePicker
            label="Entry Date & Time"
            placeholder=""
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
            {...dateFieldProps('dateTime', true)}
          />

          <CustomPicker
            label="Planned Activity"
            items={[]}
            placeholder=""
            fontFamily={family.regular}
            {...pickerFieldProps('planedActivity')}
            disabled={isLoading}
          />
          <MyInput label="Meeting Participants" {...fieldProps('meetings')} />
          <MyInput label="Activity Details" {...fieldProps('activityDetails')} />

          <AvatarPicker />
          <VideoPicker />

          <MyInput label="Visit Completion" {...fieldProps('visitCompletion')} />

          <CustomButton title='Save'
           onPress={onSave} 
          />
        </View>
      </CustomContent>
    </CustomContainer>
  )
}

export default ATPForm

const styles = StyleSheet.create({})