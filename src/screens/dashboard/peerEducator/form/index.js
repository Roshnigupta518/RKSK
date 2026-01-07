import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { CustomContainer, CustomContent } from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'
import MyInput from '../../../../components/customInput'
import CustomButton from '../../../../components/customButton';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import CustomPicker from '../../../../components/customPicker';
import st from '../../../../global/styles';
import WithImageUpload from '../../../../HOC/ImageUploader';
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../../global'
import CustomCheckbox from '../../../../components/CustomCheckbox'

const INITIALINPUT = {
  district: '',
  block: '',
  supervisorName: '',
  village: '',
  ashaName: '',
  sathiyaName: '',
  gender: '',
  activityDate: '',
  location: '',
  activityType: '',
  module: '',
  comicBook: '',
  activityMethod: '',
  participants: {
    boys: '',
    girls: '',
    supervisor: '',
    asha: '',
    cho: '',
    awc: '',
  },
  duration: '',
  materialUsed: '',
  questions: '',
  challenges: '',
  successStory: '',
};

const PeerEducatorForm = ({ navigation }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [pickerLists, setPickerLists] = useState({
    district: [],
    block: [],
    supervisor: [],
    village: [],
    asha: [],
    sathiya: [],
    gender: [],
  });
  const [attachment, setAttachment] = useState(null);
  const [attachmentErr, setAttachmentErr] = useState();
  const [isChecked, setIsChecked] = useState(false);

  const handleOnchange = useCallback(
    (field) => (value) => {
      setInputs(prev => {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value,
            },
          };
        }
        return { ...prev, [field]: value };
      });

      // 🔥 clear error for this field
      setErrors(prev => {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (!prev[parent]?.[child]) return prev;

          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: '',
            },
          };
        }

        if (!prev[field]) return prev;
        return { ...prev, [field]: '' };
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
    },
    disabled: isLoading,
  });

  const uploadProfileToServer = async res => {
    setAttachmentErr('')
    setAttachment(res);
  };

  const validateForm = () => {
    let tempErrors = {};
    let valid = true;

    // 🔹 Normal fields (input + picker + date)
    REQUIRED_FIELDS.forEach(key => {
      if (!inputs[key] || inputs[key].toString().trim() === '') {
        tempErrors[key] = 'Required';
        valid = false;
      }
    });

    // 🔹 Participants – EACH field required
    PARTICIPANT_KEYS.forEach(key => {
      const value = inputs.participants?.[key];

      if (value === '' || value === null || value === undefined) {
        if (!tempErrors.participants) tempErrors.participants = {};
        tempErrors.participants[key] = 'Required';
        valid = false;
      }
    });

    if (!attachment) {
      setAttachmentErr('Required');
      valid = false;
    } else {
      setAttachmentErr('');
    }

    setErrors(tempErrors);
    return valid;
  };

  const onSave = () => {
    if (!validateForm()) return;
    setIsLoading(true);
    // API call
  };

  useEffect(() => {
    // fetchInitialPickers();
  }, []);

  // const fetchInitialPickers = async () => {
  //   try {
  //     // example APIs
  //     const districtRes = await api.getDistricts();
  //     const genderRes = await api.getGenderList();

  //     setPickerLists(prev => ({
  //       ...prev,
  //       district: districtRes.data.map(item => ({
  //         label: item.name,
  //         value: item.id,
  //       })),
  //       gender: genderRes.data.map(item => ({
  //         label: item.name,
  //         value: item.code,
  //       })),
  //     }));
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  // useEffect(() => {
  //   if (inputs.district) {
  //     fetchBlocks(inputs.district);
  //   }
  // }, [inputs.district]);

  // const fetchBlocks = async (districtId) => {
  //   const res = await api.getBlocks(districtId);

  //   setPickerLists(prev => ({
  //     ...prev,
  //     block: res.data.map(item => ({
  //       label: item.name,
  //       value: item.id,
  //     })),
  //     village: [], // reset village
  //   }));

  //   handleOnchange('block')('');
  //   handleOnchange('village')('');
  // };

  const ReadOnlyPicker = React.memo(
    ({ label, value, items = [], error, disabled = false, onValueChange }) => {
      return (
        <CustomPicker
          label={label}
          items={items}
          selectedValue={value}
          onValueChange={onValueChange}
          disabled={disabled}
          error={error}
          placeholder=""
        />
      );
    }
  );

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

  return (
    <CustomContainer>
      <CustomHeader title="Peer Educator Reporting" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps='handled'
      >
        <CustomContent>
          <View>
            {BASIC_PICKERS.map(item => (
              <ReadOnlyPicker
                key={item.key}
                label={item.label}
                items={pickerLists[item.listKey]} // 🔥 state se aa raha
                value={inputs[item.key]}
                error={errors[item.key]}
                disabled={item.disabled}
                onValueChange={val => {
                  handleOnchange(item.key)(val);
                  handleError('', item.key);
                }}
              />
            ))}

            <CustomDatePicker
              label="गतिविधि की तारीख"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('activityDate', 'date')}
            />

            {PICKERS.map(p => (
              <CustomPicker
                key={p.key}
                items={[]}
                label={p.label}
                {...pickerFieldProps(p.key)}
              />
            ))}
          </View>

          <View style={st.card}>
            <Text style={[st.tx14, st.txbold]}>प्रतिभागियों की संख्या</Text>

            {PARTICIPANTS.map(item => (
              <View key={item.key} style={[st.row, st.align_C]}>
                <View style={st.wdh50}>
                  <Text style={st.tx12}>{item.label}</Text>
                </View>
                <View style={st.wdh50}>
                  <MyInput
                    value={inputs.participants[item.key]}
                    onChangeText={val => {
                      handleOnchange(`participants.${item.key}`)(val);
                      if (errors.participants?.[item.key]) {
                        setErrors(prev => ({
                          ...prev,
                          participants: {
                            ...prev.participants,
                            [item.key]: '',
                          },
                        }));
                      }
                    }}
                    keyboardType="numeric"
                    error={errors.participants?.[item.key]}   // 🔥
                  />
                </View>
              </View>
            ))}

          </View>

          <CustomPicker
            items={[]}
            label={'गतिविधि की अवधि'}
            placeholder=''
            {...pickerFieldProps('duration')}
          />
          <CustomPicker
            items={[]}
            label={'सामग्री उपयोग'}
            placeholder=''
            {...pickerFieldProps('materialUsed')}
          />
          <MyInput label="किशोर-किशोरियों द्वारा पूछे गए प्रमुख प्रश्न"
            {...fieldProps('questions')}
            multiline={true}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
          />

          <MyInput label="गतिविधि के दौरान आई चुनौतियां"
            {...fieldProps('challenges')}
            multiline={true}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
          />

          <MyInput label="सफलता/अच्छा अनुभव"
            {...fieldProps('successStory')}
            multiline={true}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
          />

          <AvatarPicker
            value={attachment}
            error={attachmentErr ? 'Required' : ''}
            onUpload={(res) => {
              uploadProfileToServer(res)
            }} />

          <View style={st.mt_5}>
            <CustomCheckbox
              label="I confirm that all the information entered is accurate."
              checked={isChecked}
              onChange={setIsChecked}
            />
          </View>

          <CustomButton title='Save'
            onPress={()=>
              // onSave()
              navigation.navigate('RefferalDetails')
            }
            disabled={isLoading}
            loading={isLoading}
          />

        </CustomContent>
      </KeyboardAvoidingView>
    </CustomContainer>
  )
}

export default PeerEducatorForm
const PARTICIPANTS = [
  { key: 'boys', label: 'किशोर' },
  { key: 'girls', label: 'किशोरी' },
  { key: 'supervisor', label: 'आशा सहयोगी/सुपरवाइजर' },
  { key: 'asha', label: 'आशा' },
  { key: 'cho', label: 'कम्युनिटी हेल्थ ऑफिसर' },
  { key: 'awc', label: 'आंगनवाड़ी कार्यकर्ता' },
];
const PICKERS = [
  { key: 'location', label: 'गतिविधि का स्थान ' },
  { key: 'activityType', label: 'गतिविधि का प्रकार' },
  { key: 'module', label: 'कौन-सा मॉड्यूल /विषय लिया गया?' },
  { key: 'comicBook', label: 'कौन-सी कॉमिक्स बुक का उपयोग किया गया?' },
  { key: 'activityMethod', label: 'गतिविधि कैसे की?' },
];

const BASIC_PICKERS = [
  { key: 'district', label: 'जिला', listKey: 'district', disabled: true },
  { key: 'block', label: 'विकासखंड / ब्लॉक', listKey: 'block', disabled: true },
  { key: 'supervisorName', label: 'आशा सुपरवाइजर का नाम', listKey: 'supervisor', disabled: true },
  { key: 'village', label: 'ग्राम का नाम', listKey: 'village', disabled: true },
  { key: 'ashaName', label: 'आशा का नाम', listKey: 'asha', disabled: true },
  { key: 'sathiyaName', label: 'साथिया का नाम', listKey: 'sathiya', disabled: true },
  { key: 'gender', label: 'लिंग', listKey: 'gender', disabled: false },
];

const REQUIRED_FIELDS = [
  // BASIC PICKERS
  'district',
  'block',
  'supervisorName',
  'village',
  'ashaName',
  'sathiyaName',
  'gender',

  // DATE
  'activityDate',

  // PICKERS
  'location',
  'activityType',
  'module',
  'comicBook',
  'activityMethod',

  // OTHER PICKERS
  'duration',
  'materialUsed',

  // TEXT INPUTS
  'questions',
  'challenges',
  'successStory',
];
const PARTICIPANT_KEYS = [
  'boys',
  'girls',
  'supervisor',
  'asha',
  'cho',
  'awc',
];
