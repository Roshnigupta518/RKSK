import { StyleSheet, Text, View, Platform, KeyboardAvoidingView } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { CustomContainer, CustomContent } from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'
import { useAppSelector, useAppDispatch } from '../../../../hooks'
import CustomPicker from '../../../../components/customPicker'
import MyInput from '../../../../components/customInput';
import { fetchAshaByVacantSupervisor, fetchMasters } from '../../../../redux/slices/Masters'
import CustomButton from '../../../../components/customButton';
import { ageData, booleanData, genderData, qualificationData, schStatusOption } from '../../../../utils/staticJson'
import useNetworkStatus from '../../../../hooks/networkStatus'
import { validateByRegex } from '../../../../utils/validations'
import { RegexType } from '../../../../utils/validations/regex'
import { setPeerBridageList } from '../../../../redux/slices/peerBrigade'
import { generateclientID, getLabelsFromValues } from '../../../../utils/helper'
import { ENUM } from '../../../../utils/bgservices/enum'
import { startBackgroundService } from '../../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../../utils/bgservices/backgroundTaskEnum'
import st from '../../../../global/styles'
import PeerField from '../../../../components/peerField'
import { family } from '../../../../global'

const INITIALINPUT = {

}

const BrigadeForm = ({ navigation }) => {
    const userLogin = useAppSelector(state => state.login.data);
    const ipAddress = useAppSelector(state => state.getIpAddress.data);
    const peerEducatorDetails = useAppSelector(state => state.peerEducatorList.data);
    const dispatch = useAppDispatch();
    const isConnected = useNetworkStatus()

    const isPeerEducator = userLogin?.role === 'PeerEducater';
    const [inputs, setInputs] = useState(INITIALINPUT);
    const [errors, setErrors] = useState(INITIALINPUT);
    const [isLoading, setIsLoading] = useState(false);
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

    const pickerData = {
        district: districtList,
        block: blockByDistrict[inputs.district] || [],
        supervisor: ashaSahyogiByBlock[inputs.block] || [],        // Flag 4 (ASHA Sahyogi)
        asha: ashaBySahyogi[inputs.supervisorName] || [],     // Flag 7 
        village: villageByAsha[inputs.ashaName] || [],            // Flag 8
        sathiya: peerEducatorByAsha[inputs.ashaName] || [],       // Flag 13
        // gender: genderByPeerEducator[inputs.sathiyaName] || [],   // Flag 14

    };

    const handleOnchange = useCallback(
        (field) => (value) => {
            setInputs(prev => {
                let updatedState;

                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    updatedState = {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: value,
                        },
                    };
                } else {
                    updatedState = { ...prev, [field]: value };
                }

                // ✅ SPECIAL LOGIC for qualification
                if (field === 'qualification' && (value == 7 || value == 8)) {
                    // updatedState.sch_status = '';
                    updatedState.sch_options = '';
                }

                return updatedState;
            });

            // clear error for this field
            setErrors(prev => {
                let updatedErrors;

                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    if (!prev[parent]?.[child]) return prev;

                    updatedErrors = {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: '',
                        },
                    };
                } else {
                    updatedErrors = prev[field]
                        ? { ...prev, [field]: '' }
                        : prev;
                }

                // ✅ Clear dependent field errors also
                if (field === 'qualification') {
                    updatedErrors = {
                        ...updatedErrors,
                        sch_status: '',
                        sch_options: '',
                    };
                }

                return updatedErrors;
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

    const pickerFieldProps = (field) => ({
        selectedValue: inputs[field],
        error: errors[field],
        onValueChange: (val) => {
            handleOnchange(field)(val);
            handleError('', field);
        },
        disabled: isLoading,
    });

    useEffect(() => {
        if (!districtList?.length && isConnected && !isPeerEducator) {
            dispatch(fetchMasters({ flag: 2, id: 0 }));
        }
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
            // gender: peerEducatorDetails.genderId,
          }));
        } 
      }, [isPeerEducator, peerEducatorDetails]);

    const showSchoolField =
    inputs?.qualification &&
    inputs?.qualification != 7 &&
    inputs?.qualification != 8;

    const validateForm = () => {
        let tempErrors = {};
        let valid = true;

        // 🔹 Picker validation
        if (!isPeerEducator) {
            if (!inputs.district) tempErrors.district = 'Please select district';
            if (!inputs.block) tempErrors.block = 'Please select block';
            if (inputs.supervisorName === undefined || inputs.supervisorName === null || inputs.supervisorName === '') {
                tempErrors.supervisorName = 'Please select supervisor';
            }
            if (!inputs.ashaName) tempErrors.ashaName = 'Please select ASHA';
            if (!inputs.village) tempErrors.village = 'Please select village';
            if (!inputs.sathiyaName) tempErrors.sathiyaName = 'Please select peer educator';
        }

        if (!inputs.gender) tempErrors.gender = 'Please select gender';
        if (!inputs.qualification) tempErrors.qualification = 'Please select qualification';

        // 🔹 Regex validation
        if (!validateByRegex(inputs.name, RegexType.name, 'name', tempErrors)) valid = false;
        if (!validateByRegex(inputs.father, RegexType.father, 'father', tempErrors)) valid = false;
        if (!validateByRegex(inputs.mobile, RegexType.mobile, 'mobile', tempErrors)) valid = false;
        if (!validateByRegex(inputs.age, RegexType.age, 'age', tempErrors)) valid = false;

        // 🔹 Conditional fields
        if (inputs?.qualification != 7 && inputs?.qualification != 8 ) {
            if (!inputs.sch_options) {
                tempErrors.sch_options = "Please select school status options";
                valid = false;
            }
        }

        setErrors(tempErrors);

        // agar koi picker error hai to bhi false hona chahiye
        if (Object.keys(tempErrors).length > 0) valid = false;

        return valid;
    };

    const onSaveHandle = () => {
        if (!validateForm()) return;
        console.log({ inputs })

        const qualification_temp = qualificationData.find((i)=>i.value === inputs.qualification)

        const payload = {
            "districtID": inputs.district,
            "districtName": !isPeerEducator ? getLabelsFromValues(inputs.district, pickerData.district).join(''):peerEducatorDetails.districtName,
            "blockID": inputs.block,
            "blockNameE": !isPeerEducator ? getLabelsFromValues(inputs.block, pickerData.block).join(''): peerEducatorDetails.blockName,
            "ashaSahyogiID": inputs?.supervisorName,
            "ashaSahyogi": !isPeerEducator ?getLabelsFromValues(inputs.supervisorName, pickerData.supervisor).join(''): peerEducatorDetails.ashaSahyogi_Name,
            "ashaId": inputs?.ashaName,
            "asha": !isPeerEducator ? getLabelsFromValues(inputs.ashaName, pickerData.asha).join(''): peerEducatorDetails.ashaName,
            "villageID": inputs?.village,
            "villageName":  !isPeerEducator ? getLabelsFromValues(inputs.village, pickerData.village).join(''): peerEducatorDetails.villageName,
            "peerEducatorName": !isPeerEducator ? getLabelsFromValues(inputs.sathiyaName, pickerData.sathiya).join(''): peerEducatorDetails.peerEducatorName,
            "peerEducatorId" : inputs?.sathiyaName ,
            "brigadeMemberName": inputs?.name,
            "brigadeMemberGender": getLabelsFromValues(inputs.gender, genderData).join(''),
             brigadeMemberGenderId:inputs.gender,
            "brigadeMemberAge": inputs.age,
            "brigadeMemberMobile": inputs.mobile,
            "brigadeMemberGuardianName": inputs?.father,
            "brigadeMemberEducation": qualification_temp?.label,
            "isSchoolGoing": inputs?.sch_options || 0,
            clientId: generateclientID(userLogin.userId),
            syncStatus: ENUM.SERVERSTATUS.NOTSTARTED,
            createdOn: new Date().toISOString(),
            retryCount: 0,
            IP: ipAddress,
        };

        dispatch(setPeerBridageList(payload))
        startBackgroundService(syncTaskName.syncPeerBrigadeForm)
        navigation.goBack()
    }

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

    return (
        <CustomContainer>
            <CustomHeader title="Brigade Form" onBackPress={() => navigation.goBack()} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps='handled'>
                <CustomContent>
                    <View>
                        {!isPeerEducator &&
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
                                                    console.log({ val })
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
                                                        // gender: '',
                                                    }));
                                                }

                                                if (item.key === 'ashaName') {
                                                    dispatch(fetchMasters({ flag: 8, id: val }));   // Village
                                                    dispatch(fetchMasters({ flag: 13, id: val })); // Peer Educator

                                                    setInputs(prev => ({
                                                        ...prev,
                                                        village: '',
                                                        sathiyaName: '',
                                                        // gender: '',
                                                    }));
                                                }

                                                if (item.key === 'sathiyaName') {
                                                    // dispatch(fetchMasters({ flag: 14, id: val })); // Gender
                                                    // dispatch(setPeerEducatorId(val))
                                                    // setInputs(prev => ({
                                                    //     ...prev,
                                                    //     gender: '',
                                                    // }));
                                                    // startBackgroundService(syncTaskName.syncPeerReportingCount)
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        }

                        {isPeerEducator && (
                            <View style={st.card}>
                                <PeerField label="District/जिला" value={peerEducatorDetails.districtName} />
                                <PeerField label="Block/विकासखंड" value={peerEducatorDetails.blockName} />
                                <PeerField label="ASHA Supervisor/आशा सुपरवाइजर का नाम" value={
                                    peerEducatorDetails?.ashaFacilitatorId == 0 ? 'Not available' : peerEducatorDetails.ashaSahyogi_Name} />
                                <PeerField label="ASHA/आशा का नाम" value={peerEducatorDetails.ashaName} />
                                <PeerField label="Village/ग्राम का नाम" value={peerEducatorDetails.villageName} />
                                <PeerField label="Peer educator/साथिया का नाम" value={peerEducatorDetails.peerEducatorName} />
                                <PeerField label="Gender/लिंग" value={peerEducatorDetails.gender} />
                            </View>
                        )}


                        <MyInput label="Name/ब्रिगेड सदस्य का नाम *"
                            {...fieldProps('name')}
                            maxLength={30}
                        />

                        <CustomPicker
                            label={'Gender/लिंग *'}
                            items={genderData}
                            {...pickerFieldProps('gender')}
                            fontFamily={family.regular}
                        />

                        {/* <MyInput label="Age/आयु *"
                            {...fieldProps('age')}
                            keyboardType="numeric"
                            maxLength={2}
                        /> */}

                        <CustomPicker
                            label={'Age/आयु *'}
                            items={ageData}
                            {...pickerFieldProps('age')}
                            fontFamily={family.regular}
                        />

                        <MyInput label="Mobile Number/मोबाइल नंबर *"
                            {...fieldProps('mobile')}
                            keyboardType="numeric"
                            maxLength={10}
                        />

                        <MyInput label="Father / Guardian Name पिता / अभिभावक का नाम *"
                            {...fieldProps('father')}
                            maxLength={30}
                        />

                        <CustomPicker
                            label={'Educator Qualification/ शैक्षणिक योग्यता *'}
                            items={qualificationData}
                            {...pickerFieldProps('qualification')}
                            fontFamily={family.regular}
                        />

                            {showSchoolField &&
                                <View>
                                    <CustomPicker
                                        label={'School Status Options/ विद्यालय जाने की स्थिति का प्रकार *'}
                                        items={schStatusOption}
                                        {...pickerFieldProps('sch_options')}
                                        fontFamily={family.regular}
                                    />
                                </View>
                            }

                        <CustomButton title='Add'
                            onPress={() =>
                                onSaveHandle()
                            }
                            disabled={isLoading}
                            loading={isLoading}
                        />
                    </View>
                </CustomContent>
            </KeyboardAvoidingView>
        </CustomContainer>
    )
}

export default BrigadeForm

const BASIC_PICKERS = [
    { key: 'district', label: 'District/जिला *', listKey: 'district', disableForPE: true },
    { key: 'block', label: 'Block/विकासखंड *', listKey: 'block', disableForPE: true },
    { key: 'supervisorName', label: 'ASHA Supervisor/आशा सुपरवाइजर का नाम *', listKey: 'supervisor', disableForPE: true },
    { key: 'ashaName', label: 'ASHA/आशा का नाम *', listKey: 'asha', disableForPE: true },
    { key: 'village', label: 'Village/ग्राम का नाम *', listKey: 'village', disableForPE: true },
    { key: 'sathiyaName', label: 'Peer educator/साथिया का नाम *', listKey: 'sathiya', disableForPE: true },
    // { key: 'gender', label: 'लिंग *', listKey: 'gender', disableForPE: true },
];