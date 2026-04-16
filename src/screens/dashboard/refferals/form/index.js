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
import { fetchAshaByVacantSupervisor, fetchMasters } from '../../../../redux/slices/Masters'
import useNetworkStatus from '../../../../hooks/networkStatus'
import { activityPlace, genderData, activityType, moduleData, comicBooks, activityToDo, activityDuration, contentUse } from '../../../../utils/staticJson'
import CustomMultiSelect from '../../../../components/customMultiselect'
import { getLabelsFromValues } from '../../../../utils/helper'
import PeerField from '../../../../components/peerField'
import { setPeerEducatorId, clearPeerEducatorId } from '../../../../redux/slices/peerReportingCount'
import { startBackgroundService } from '../../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../../utils/bgservices/backgroundTaskEnum'

const INITIALINPUT = {
  district: '',
  block: '',
  supervisorName: '',
  village: '',
  ashaName: '',
  sathiyaName: '',
  gender: '',
  activityDate: '',

 
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
  const peerEducatorReportingCount = useAppSelector(state => state.peerReportingCount?.data?.reportingCount)
  const isTrainer = userLogin?.role === 'TrainerUser';
  const isPeerEducator = userLogin?.role === 'PeerEducater';

  const pickerData = {
    district: districtList,
    block: blockByDistrict[inputs.district] || [],
    supervisor: ashaSahyogiByBlock[inputs.block] || [],        // Flag 4 (ASHA Sahyogi)
    asha: ashaBySahyogi[inputs.supervisorName] || [],     // Flag 7 
    village: villageByAsha[inputs.ashaName] || [],            // Flag 8
    sathiya: peerEducatorByAsha[inputs.ashaName] || [],       // Flag 13
    gender: genderByPeerEducator[inputs.sathiyaName] || [],   // Flag 14
  };

  console.log({pickerData})

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
        gender: peerEducatorDetails.genderId,
      }));
      startBackgroundService(syncTaskName.syncPeerReportingCount)
    } else{
      dispatch(clearPeerEducatorId())
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
      const value = inputs[key];
    
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (!Array.isArray(value) && value !== 0 && value.toString().trim() === '')
      ) {
        tempErrors[key] = 'Required';
        valid = false;
      }
    });


    setErrors(tempErrors);
    console.log({tempErrors, valid})
    return valid;
  };  

  const onSave = () => {
    console.log({inputs})
    if (!validateForm()) return;
  
    const dataWithNames = {
      ...inputs,
      districtName: !isPeerEducator ? pickerData.district.find(i => i.value == inputs.district)?.label : peerEducatorDetails.districtName,
      blockName: !isPeerEducator ? pickerData.block.find(i => i.value == inputs.block)?.label : peerEducatorDetails.blockName,
      supervisorNameText: !isPeerEducator ? pickerData.supervisor.find(i => i.value == inputs.supervisorName)?.label : peerEducatorDetails.ashaSahyogi_Name,
      ashaNameText: !isPeerEducator ? pickerData.asha.find(i => i.value == inputs.ashaName)?.label : peerEducatorDetails.ashaName,
      villageName: !isPeerEducator ? pickerData.village.find(i => i.value == inputs.village)?.label : peerEducatorDetails.villageName,
      sathiyaNameText: !isPeerEducator ? pickerData.sathiya.find(i => i.value == inputs.sathiyaName)?.label : peerEducatorDetails.peerEducatorName,
      genderText: !isPeerEducator ? pickerData.gender.find(i => i.value == inputs.gender)?.label : peerEducatorDetails.gender,
    };
  
    navigation.navigate('RefferalDetails', { data: dataWithNames, individualReferral: true });
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
    ({ handleMediaUpload, value, error, onRemove, disabled }) => (
      <View pointerEvents={disabled ? 'none' : 'auto'}>
        <Text style={st.tx12}>Photo Capture *</Text>
  
        <Pressable onPress={handleMediaUpload}>
          <View style={[st.photoContainer, { borderColor: error ? colors.red : '#ccc', backgroundColor: disabled ? colors.disabled : colors.white, }]}>
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
                {value?.length != 3&&
                 <Pressable style={[st.plusbox]} onPress={handleMediaUpload}>
                      <Icon name={'plus-circle'} size={20} color={colors.blue} />
                  </Pressable>}
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
  console.log({peerEducatorDetails})

  return (
    <CustomContainer>
      <CustomHeader title="Refferal Form" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps='handled'>
        <CustomContent>
         
          <View>
          {!isPeerEducator&&
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
                      // dispatch(fetchMasters({ flag: 7, id: val })); // ASHA by ASHA Sahyogi
                       console.log({val})
                      if (val == 0) {
                        // 🔥 vacant supervisor case
                        dispatch(fetchAshaByVacantSupervisor({ 
                          blockId: inputs.block 
                        }));
                      } else {
                        // normal case
                        dispatch(fetchMasters({ flag: 7, id: val }));
                      }

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
                      dispatch(setPeerEducatorId(val))
                      setInputs(prev => ({
                        ...prev,
                        gender: '',
                      }));
                      startBackgroundService(syncTaskName.syncPeerReportingCount)
                    }
                  }}
                />
              );
            })}
            </View>
            }

            {isPeerEducator && ( 
                <View style={st.card}>
                  <PeerField label="जिला" value={peerEducatorDetails.districtName} />
                  <PeerField label="ब्लॉक" value={peerEducatorDetails.blockName} />
                  <PeerField label="आशा सुपरवाइजर का नाम" value={
                    peerEducatorDetails?.ashaFacilitatorId == 0 ? 'Not available' : peerEducatorDetails.ashaSahyogi_Name} />
                  <PeerField label="आशा का नाम" value={peerEducatorDetails.ashaName} />
                  <PeerField label="ग्राम का नाम" value={peerEducatorDetails.villageName} />
                  <PeerField label="साथिया का नाम" value={peerEducatorDetails.peerEducatorName} />
                  <PeerField label="लिंग" value={peerEducatorDetails.gender} />
                </View>
            )} 

            <CustomDatePicker
              label="रेफेर करने की दिनांक"
              placeholder=""
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              iconName={'calendar'}
              {...dateFieldProps('activityDate', 'date')}
            />
          </View>

          <CustomButton title='Next'
            onPress={() =>
              onSave()
            }
            disabled={isLoading}
            loading={isLoading}
          />

        </CustomContent>
      </KeyboardAvoidingView>
    </CustomContainer>
  )
}

export default PeerEducatorForm;

const PARTICIPANTS = [
  { key: 'boys', label: 'किशोर *' },
  { key: 'girls', label: 'किशोरी *' },
  { key: 'supervisor', label: 'आशा सहयोगी/सुपरवाइजर *' },
  { key: 'asha', label: 'आशा *' },
  { key: 'cho', label: 'कम्युनिटी हेल्थ ऑफिसर *' },
  { key: 'awc', label: 'आंगनवाड़ी कार्यकर्ता *' },
  { key: 'parents', label: 'अभिभावक *' },
  { key: 'ngo', label: 'NGO प्रशिक्षक *' },
  { key: 'teacher', label: 'शिक्षक *' },
];
const PICKERS = [
  // { key: 'location', label: 'गतिविधि का स्थान *' },
  { key: 'activityType', label: 'गतिविधि का प्रकार *' },
  { key: 'module', label: 'कौन-सा मॉड्यूल /विषय लिया गया?' },
  { key: 'comicBook', label: 'कौन-सी कॉमिक्स बुक का उपयोग किया गया?' },
  { key: 'activityMethod', label: 'गतिविधि कैसे की?' },
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
];

