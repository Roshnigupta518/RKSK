import { StyleSheet, Text, View, Platform, KeyboardAvoidingView } from 'react-native'
import React, { useState, useCallback } from 'react'
import { CustomContainer, CustomContent } from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'
import { useAppSelector, useAppDispatch } from '../../../../hooks'
import CustomPicker from '../../../../components/customPicker'
import MyInput from '../../../../components/customInput';
import { fetchAshaByVacantSupervisor, fetchMasters } from '../../../../redux/slices/Masters'
import CustomButton from '../../../../components/customButton';

const INITIALINPUT = {

}

const BrigadeForm = ({ navigation }) => {
    const userLogin = useAppSelector(state => state.login.data);
    const dispatch = useAppDispatch();

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
        gender: genderByPeerEducator[inputs.sathiyaName] || [],   // Flag 14

    };

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

    const pickerFieldProps = (field) => ({
        selectedValue: inputs[field],
        error: errors[field],
        onValueChange: (val) => {
            handleOnchange(field)(val);
            handleError('', field);
        },
        disabled: isLoading,
    });

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

                        <MyInput label="Name/ब्रिगेड सदस्य का नाम *"
                            {...fieldProps('name')}
                            maxLength={30}
                        />

                        <CustomPicker
                            label={'Gender/लिंग *'}
                            items={[]}
                            {...pickerFieldProps('location')}
                        />
                        <MyInput label="Age/आयु *"
                            {...fieldProps('age')}
                            maxLength={3}
                        />
                        <MyInput label="Mobile Number/मोबाइल नंबर *"
                            {...fieldProps('mobile')}
                            maxLength={10}
                        />
                        <MyInput label="Father / Guardian Name पिता / अभिभावक का नाम *"
                            {...fieldProps('father')}
                            maxLength={30}
                        />

                        <CustomPicker
                            label={'Educator Qualification/ शैक्षणिक योग्यता *'}
                            items={[]}
                            {...pickerFieldProps('qualification')}
                        />
                        <MyInput label="School Status/विद्यालय जाने की स्थिति *"
                            {...fieldProps('sch_status')}
                        />
                        <MyInput label="School Status Options/ विद्यालय जाने की स्थिति का प्रकार *"
                            {...fieldProps('sch_options')}
                        />

                        <CustomButton title='Add'
                            onPress={() =>
                                navigation.goBack()
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