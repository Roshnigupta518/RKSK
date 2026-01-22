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
import { useAppSelector, useAppDispatch } from '../../../../hooks'
import { fetchMasters } from '../../../../redux/slices/Masters'
import useNetworkStatus from '../../../../hooks/networkStatus'
import { activityPlace, genderData, activityType, moduleData, comicBooks, activityToDo, activityDuration, contentUse } from '../../../../utils/staticJson'
import CustomMultiSelect from '../../../../components/customMultiselect'
import { getLabelsFromValues } from '../../../../utils/helper'

const INITIALINPUT = {
  district: '',
  block: '',
  supervisorName: '',
  village: '',
  ashaName: '',
  sathiyaName: '',
  gender: '',
  activityDate: '',
  location: [],
  activityType: [],
  module: [],
  comicBook: [],
  activityMethod: [],
  participants: {
    boys: '',
    girls: '',
    supervisor: '',
    asha: '',
    cho: '',
    awc: '',
  },
  duration: '',
  materialUsed: [],
  questions: '',
  challenges: '',
  successStory: '',
};

const PeerEducatorForm = ({ navigation }) => {
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState([]);
  const [attachmentErr, setAttachmentErr] = useState();

  const isConnected = useNetworkStatus()

  const dispatch = useAppDispatch();
  const {
    districtList = [],
    blockByDistrict = {},
    ashaSahyogiByBlock = {},    
    ashaBySahyogi = {},      // Flag 7 
    villageByAsha = {},         // Flag 8
    peerEducatorByAsha = {},    // Flag 13
    genderByPeerEducator = {},  // Flag 14
    loading,
  } = useAppSelector(state => state.masters);

  const userLogin = useAppSelector(state => state.login.data);
  const peerEducatorDetails = useAppSelector(state => state.peerEducatorList.data);

  const isTrainer = userLogin?.role === 'TrainerUser';
  const isPeerEducator = userLogin?.role === 'Peer Educater';

  const pickerData = {
    district: districtList,
    block: blockByDistrict[inputs.district] || [],
    supervisor: ashaSahyogiByBlock[inputs.block] || [],        // Flag 4 (ASHA Sahyogi)
    asha: ashaBySahyogi[inputs.supervisorName] || [],     // Flag 7 
    village: villageByAsha[inputs.ashaName] || [],            // Flag 8
    sathiya: peerEducatorByAsha[inputs.ashaName] || [],       // Flag 13
    gender: genderByPeerEducator[inputs.sathiyaName] || [],   // Flag 14
    location: activityPlace || [],
    activityType: activityType || [],
    activityMethod: activityToDo || [],
    module: moduleData || [],
    comicBook: comicBooks || [],
  };

  useEffect(() => {
    if (!districtList?.length && isConnected && !isPeerEducator) {
      dispatch(fetchMasters({ flag: 2, id: 0 }));
    }
  }, []);

  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      activityDate: prev.date || new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    if (districtList?.length && userLogin?.districtId && !isPeerEducator) {
      setInputs(prev => ({
        ...prev,
        district: userLogin.districtId,
      }));

      dispatch(fetchMasters({
        flag: 3,
        id: userLogin.districtId,
      }));
    }
  }, [districtList]);

  const blockList = blockByDistrict?.[inputs.district] || [];

  useEffect(() => {
    if (blockList.length && userLogin?.blockId && !isPeerEducator) {
      setInputs(prev => ({
        ...prev,
        block: userLogin.blockId,
      }));

      dispatch(fetchMasters({
        flag: 4,
        id: userLogin.blockId,
      }));
    }
  }, [blockList]);

  const mapGenderToValue = (genderText, genderList) => {
    const found = genderList.find(g => g.label === genderText);
    return found ? found.value : '';
  };
  
  useEffect(() => {
    if (isPeerEducator && peerEducatorDetails) {
      setInputs(prev => ({
        ...prev,
        district: String(peerEducatorDetails.districtId || ''),
        block: String(peerEducatorDetails.blockId || ''),
        supervisorName: String(peerEducatorDetails.ashaFacilitatorId || ''),
        ashaName: String(peerEducatorDetails.ashaId || ''),
        village: String(peerEducatorDetails.villageId || ''),
        sathiyaName: String(peerEducatorDetails.id || ''),
        gender: mapGenderToValue(peerEducatorDetails.gender, genderByPeerEducator[peerEducatorDetails.id] || [])
      }));
      
      // 🔁 Cascade API calls to populate dropdowns
      dispatch(fetchMasters({ flag: 3, id: peerEducatorDetails.districtId })); // block
      dispatch(fetchMasters({ flag: 4, id: peerEducatorDetails.blockId }));    // asha sahyogi
      dispatch(fetchMasters({ flag: 7, id: peerEducatorDetails.ashaFacilitatorId })); // asha
      dispatch(fetchMasters({ flag: 8, id: peerEducatorDetails.ashaId }));     // village
      dispatch(fetchMasters({ flag: 13, id: peerEducatorDetails.ashaId }));    // peer educator
      dispatch(fetchMasters({ flag: 14, id: peerEducatorDetails.id }));        // gender
    }
  }, [isPeerEducator, peerEducatorDetails]);
  
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

      // clear error for this field
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

  const multiSelectFieldProps = (field) => ({
    selectedItems: inputs[field],
    onSelectedItemsChange: (val) => {
      handleOnchange(field)(val);
      if (errors[field]) handleError('', field);
    },
    disabled: isLoading,
    error: errors[field],
  });

  const uploadProfileToServer = async res => {
    setAttachmentErr('');

    setAttachment(prev => {
      if (prev.length >= 3) {
        setAttachmentErr('अधिकतम 3 फोटो अपलोड कर सकते हैं');
        return prev;
      }
      return [...prev, res];
    });
  };

  const validateForm = () => {
    let tempErrors = {};
    let valid = true;

    // Normal fields (input + picker + date)
    REQUIRED_FIELDS.forEach(key => {
      if (
        !inputs[key] ||
        (Array.isArray(inputs[key]) && inputs[key].length === 0) ||
        (!Array.isArray(inputs[key]) && inputs[key].toString().trim() === '')
      ) {
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
      else if (isNaN(value)) {
        if (!tempErrors.participants) tempErrors.participants = {};
        tempErrors.participants[key] = 'Only number allowed';
        valid = false;
      }
      else if (Number(value) < 0) {
        if (!tempErrors.participants) tempErrors.participants = {};
        tempErrors.participants[key] = 'Value cannot be negative';
        valid = false;
      }
    });

    if (!attachment || attachment.length < 1) {
      setAttachmentErr('कम से कम 1 फोटो अपलोड करें');
      valid = false;
    } else if (attachment.length > 3) {
      setAttachmentErr('अधिकतम 3 फोटो अपलोड कर सकते हैं');
      valid = false;
    } else {
      setAttachmentErr('');
    }

    setErrors(tempErrors);
    return valid;
  };  

  const onSave = () => {
    if (!validateForm()) return;
  
    const dataWithNames = {
      ...inputs,
      attachment,
  
      districtName: pickerData.district.find(i => i.value == inputs.district)?.label || '',
      blockName: pickerData.block.find(i => i.value == inputs.block)?.label || '',
      supervisorNameText: pickerData.supervisor.find(i => i.value == inputs.supervisorName)?.label || '',
      ashaName: pickerData.asha.find(i => i.value == inputs.ashaName)?.label || '',
      villageName: pickerData.village.find(i => i.value == inputs.village)?.label || '',
      sathiyaName: pickerData.sathiya.find(i => i.value == inputs.sathiyaName)?.label || '',
      genderText: pickerData.gender.find(i => i.value == inputs.gender)?.label || '',
  
      locationText: getLabelsFromValues(inputs.location, pickerData.location),
      activityTypeText: getLabelsFromValues(inputs.activityType, pickerData.activityType),
      moduleText: getLabelsFromValues(inputs.module, pickerData.module),
      comicBookText: getLabelsFromValues(inputs.comicBook, pickerData.comicBook),
      activityMethodText: getLabelsFromValues(inputs.activityMethod, pickerData.activityMethod),
      materialUsedText: getLabelsFromValues(inputs.materialUsed, contentUse),
    };
  
    navigation.navigate('RefferalDetails', { data: dataWithNames });
  };
  

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

  const removeImage = index => {
    setAttachment(prev => prev.filter((_, i) => i !== index));
  };

  const AvatarPicker = WithImageUpload(
    ({ handleMediaUpload, value, error, onRemove }) => (
      <View>
        <Text style={st.tx12}>Photo Capture *</Text>
  
        <Pressable onPress={handleMediaUpload}>
          <View style={[st.photoContainer, { borderColor: error ? colors.red : '#ccc' }]}>
            {value?.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                {value.map((img, index) => (
                  <View key={index} style={{ position: 'relative', marginRight: 6 }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={st.imageSty}
                    />
  
                    {/* ❌ REMOVE ICON */}
                    <Pressable
                      onPress={() => onRemove(index)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        padding: 2,
                        elevation: 3,
                      }}
                    >
                      <Icon name="x-circle" size={18} color={colors.blue} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={st.center}>
                <Icon name={'camera'} size={20} color={colors.lightGrey} />
                <Text style={[st.tx12, { color: colors.lightGrey }]}>
                  Tap to Capture Photo
                </Text>
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
        keyboardShouldPersistTaps='handled'>
        <CustomContent>
          <View>
            {BASIC_PICKERS.map(item => {
              const shouldDisable =
                isPeerEducator && item.disableForPE;

              return (
                <ReadOnlyPicker
                  key={item.key}
                  label={item.label}
                  items={pickerData[item.listKey]}
                  value={inputs[item.key]}
                  error={errors[item.key]}
                  disabled={shouldDisable}
                  onValueChange={val => {
                    if (shouldDisable) return;

                    handleOnchange(item.key)(val);
                    handleError('', item.key);

                    if (item.key === 'supervisorName') {
                      dispatch(fetchMasters({ flag: 7, id: val })); // ASHA by ASHA Sahyogi
                      setInputs(prev => ({
                        ...prev,
                        ashaName: '',
                        village: '',
                        sathiyaName: '',
                        gender: '',
                      }));
                    }

                    if (item.key === 'ashaName') {
                      dispatch(fetchMasters({ flag: 8, id: val }));   // Village
                      dispatch(fetchMasters({ flag: 13, id: val })); // Peer Educator

                      setInputs(prev => ({
                        ...prev,
                        village: '',
                        sathiyaName: '',
                        gender: '',
                      }));
                    }

                    if (item.key === 'sathiyaName') {
                      dispatch(fetchMasters({ flag: 14, id: val })); // Gender

                      setInputs(prev => ({
                        ...prev,
                        gender: '',
                      }));
                    }
                  }}
                />
              );
            })}

            <CustomDatePicker
              label="गतिविधि की तारीख"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('activityDate', 'date')}
            />

            {PICKERS.map(p => (
              <CustomMultiSelect
                key={p.key}
                label={p.label}
                items={pickerData[p.key]}
                placeholder=""
                required
                {...multiSelectFieldProps(p.key)}
              />
            ))}

          </View>

          <View style={[st.card, st.mt_10]}>
            <Text style={[st.tx14, st.txbold]}>प्रतिभागियों की संख्या *</Text>

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
            items={activityDuration}
            label={'गतिविधि की अवधि *'}
            placeholder=''
            {...pickerFieldProps('duration')}
          />

          <CustomMultiSelect
            label={'सामग्री उपयोग *'}
            items={contentUse}
            placeholder=""
            required
            {...multiSelectFieldProps('materialUsed')}
          />

          <MyInput label="किशोर-किशोरियों द्वारा पूछे गए प्रमुख प्रश्न *"
            {...fieldProps('questions')}
            multiline={true}
            maxLength={100}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
            keyboardType="default"
          />
          <Text style={[st.error, st.txAlignR]}>
            {inputs.questions?.length || 0}/100
          </Text>

          <MyInput label="गतिविधि के दौरान आई चुनौतियां *"
            {...fieldProps('challenges')}
            multiline={true}
            maxLength={100}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
            keyboardType="default"
          />
          <Text style={[st.error, st.txAlignR]}>
            {inputs.challenges?.length || 0}/100
          </Text>

          <MyInput label="सफलता/अच्छा अनुभव"
            {...fieldProps('successStory')}
            multiline={true}
            maxLength={100}
            inputsty={{ height: 120 }}
            inputTxt={{ textAlignVertical: 'top' }}
            keyboardType="default"
          />
          <Text style={[st.error, st.txAlignR]}>
            {inputs.successStory?.length || 0}/100
          </Text>

            <AvatarPicker
              value={attachment}
              error={attachmentErr}
              onUpload={uploadProfileToServer}
              onRemove={removeImage}
            />

          <CustomButton title='Next'
            onPress={() =>
              onSave()
              // navigation.navigate('RefferalDetails')
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
  { key: 'boys', label: 'किशोर *' },
  { key: 'girls', label: 'किशोरी *' },
  { key: 'supervisor', label: 'आशा सहयोगी/सुपरवाइजर *' },
  { key: 'asha', label: 'आशा *' },
  { key: 'cho', label: 'कम्युनिटी हेल्थ ऑफिसर *' },
  { key: 'awc', label: 'आंगनवाड़ी कार्यकर्ता *' },
];
const PICKERS = [
  { key: 'location', label: 'गतिविधि का स्थान *' },
  { key: 'activityType', label: 'गतिविधि का प्रकार *' },
  { key: 'module', label: 'कौन-सा मॉड्यूल /विषय लिया गया? *' },
  { key: 'comicBook', label: 'कौन-सी कॉमिक्स बुक का उपयोग किया गया? *' },
  { key: 'activityMethod', label: 'गतिविधि कैसे की? *' },
];

const BASIC_PICKERS = [
  { key: 'district', label: 'जिला *', listKey: 'district', disableForPE: true },
  { key: 'block', label: 'विकासखंड / ब्लॉक *', listKey: 'block', disableForPE: true },
  { key: 'supervisorName', label: 'आशा सुपरवाइजर का नाम *', listKey: 'supervisor', disableForPE: true },
  { key: 'ashaName', label: 'आशा का नाम *', listKey: 'asha', disableForPE: true },
  { key: 'village', label: 'ग्राम का नाम *', listKey: 'village', disableForPE: true },
  { key: 'sathiyaName', label: 'साथिया का नाम *', listKey: 'sathiya', disableForPE: true },
  { key: 'gender', label: 'लिंग *', listKey: 'gender', disableForPE: true },
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
  // 'successStory',
];
const PARTICIPANT_KEYS = [
  'boys',
  'girls',
  'supervisor',
  'asha',
  'cho',
  'awc',
];
