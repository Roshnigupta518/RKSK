import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, { useCallback, useState, useRef } from 'react'
import { CustomContainer, CustomContent } from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'
import CustomPicker from '../../../../components/customPicker'
import { booleanData, referralOptions } from '../../../../utils/constant/staticJson'
import Button from '../../../../components/customButton'
import ReusableBottomSheet from '../../../../components/filterSheet'
import MyInput from '../../../../components/customInput'
import CustomCheckbox from '../../../../components/CustomCheckbox'
import st from '../../../../global/styles'
import Toast from 'react-native-toast-message'
import { setPeerReferralList } from '../../../../redux/slices/ReferralList'
import { useAppDispatch, useAppSelector } from '../../../../hooks'
import { generateclientID, getLabelsFromValues } from '../../../../utils/helper';
import { ENUM } from '../../../../utils/bgservices/enum'
import { genderData } from '../../../../utils/staticJson'
import { syncTaskName } from '../../../../utils/bgservices/backgroundTaskEnum'
import { startBackgroundService } from '../../../../utils/bgservices/backgroundService'
import PeerField from '../../../../components/peerField'
import { useLocation } from '../../../../hooks/useLocation'
import { validateLocationBeforeSubmit } from '../../../../utils/validations'

const INITIALINPUT = {
    refer: '',
    healthissue: '',
    gender: '',
    name: ''
}

const RefferalDetails = ({ navigation, route }) => {
    const [inputs, setInputs] = useState(INITIALINPUT);
    const [errors, setErrors] = useState(INITIALINPUT);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReferrals, setSelectedReferrals] = useState([]);
    const [referralList, setReferralList] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const userLogin = useAppSelector(state => state.login.data);
    const { data } = route.params || {}

    const sheetRef = useRef();
    const submitLock = useRef(false);
    const dispatch = useAppDispatch()
    const ipAddress = useAppSelector(state => state.getIpAddress.data);

    const { location, error, locationArea, openLocationSettings, getLocation, permissionHandle } = useLocation();

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

    const pickerFieldProps = (field) => ({
        selectedValue: inputs[field],
        error: errors[field],
        onValueChange: (val) => {
            handleOnchange(field)(val);
            handleError('', field);
        },
        disabled: isLoading,
    });

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

    const renderConsent = () => {
        return (
            <View style={st.mt_5}>
                <CustomCheckbox
                    label="I confirm that all the information entered is accurate."
                    checked={isChecked}
                    onChange={setIsChecked}
                />
            </View>
        )
    }

    const showConsentError = () => {
        Toast.show({
            type: "myCustomType",
            text1: "Error",
            text2: "Please acknowledge before submitting",
            props: { key: 'error' },
        });
    }

    const clearFilters = () => {
        setInputs(INITIALINPUT);
        sheetRef.current.close();
    };

    const onFilterApplyPress = () => {
        sheetRef.current.close();
    };

    const toggleReferral = (item) => {
        setSelectedReferrals((prev) =>
            prev.includes(item.label)
                ? prev.filter((i) => i !== item.label)
                : [...prev, item.label]
        );
    };

    const onSaveHandle = () => {

        if (!validateReferralForm()) {
            return; // stop if invalid
        }

        sheetRef.current.close()

        if (inputs.refer == 2) {
            navigation.navigate('PeerEducator')
        } else {
            const newItem = {
                name: inputs.name,
                gender: getLabelsFromValues(inputs.gender, genderData).join(''),
                healthissue: inputs.healthissue,
                referrals: selectedReferrals,
            };

            setReferralList(prev => [...prev, newItem]);

            // reset bottom sheet form
            setInputs(prev => ({
                ...prev,
                name: '',
                gender: '',
                healthissue: '',
            }));

            setSelectedReferrals([]);
        }
    }

    const validateReferralForm = () => {
        let isValid = true;
        let newErrors = { ...INITIALINPUT };

        if (!inputs.name?.trim()) {
            newErrors.name = 'Required';
            isValid = false;
        }

        if (!inputs.gender) {
            newErrors.gender = 'Required';
            isValid = false;
        }

        if (selectedReferrals.length === 0) {
            Toast.show({
                type: "myCustomType",
                text1: "Error",
                text2: "कम से कम एक रेफरल विकल्प चुनें",
                props: { key: 'error' },
            });
            isValid = false;
        }

        if (!inputs.healthissue?.trim()) {
            newErrors.healthissue = 'Required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onSubmitAll = () => {
        if (submitLock.current) return;
        submitLock.current = true;

        const isLocationValid = validateLocationBeforeSubmit({
            location,
            error,
            getLocation,
            openLocationSettings,
            permissionHandle,
        });

        if (!isLocationValid) {
            submitLock.current = false; 
            return;
        }

        // ✅ location available
        console.log(location.latitude, location.longitude);

        if (!isChecked) {
            showConsentError();
            submitLock.current = false;
            return;
        }

        setIsLoading(true);

        const payload = {
            ...data,
            refer: inputs.refer,
            referrals: referralList,
            clientId: generateclientID(userLogin.userId),
            syncStatus: ENUM.SERVERSTATUS.NOTSTARTED,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            IP: ipAddress,
            id: 0,
            location,
            locationArea
        };

        dispatch(setPeerReferralList(payload));
        startBackgroundService(syncTaskName.syncPeerEducatorFormData)
        navigation.replace('MainApp', {
            screen: 'PeerEducator',
        });
        setIsLoading(false)
        submitLock.current = false;
    };

    const notAddedReferral = () => {
        if (submitLock.current) return;
        submitLock.current = true;

        const isLocationValid = validateLocationBeforeSubmit({
            location,
            error,
            getLocation,
            openLocationSettings,
            permissionHandle,
        });

        console.log({isLocationValid})

        if (!isLocationValid) {
            submitLock.current = false; // ✅ IMPORTANT
            return;
        }

        // ✅ location available
        console.log(location.latitude, location.longitude);

        if (!isChecked) {
            showConsentError();
            submitLock.current = false;
            return;
        }

        setIsLoading(true);

        const payload = {
            ...data,
            refer: inputs.refer,
            referrals: [],
            clientId: generateclientID(userLogin.userId),
            syncStatus: ENUM.SERVERSTATUS.NOTSTARTED,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            id: 0,
            IP: ipAddress,
            location,
            locationArea
        };

        dispatch(setPeerReferralList(payload));

        startBackgroundService(syncTaskName.syncPeerEducatorFormData)

        navigation.replace('MainApp', {
            screen: 'PeerEducator',
        });
        setIsLoading(false)
        submitLock.current = false;
    }

    const renderText = (label, value) => {
        return (
            <PeerField label={label} value={value} />
        )
    }

    const renderItem = ({ item, index }) => {
        return (
            <View style={st.card} key={index}>
                {renderText('किशोर/किशोरी का नाम:', item.name)}
                {renderText('लिंग:', getLabelsFromValues(item.gender, genderData))}
                {renderText('किसको रेफर किया:', item.referrals.join(', '))}
                {renderText('समस्या/विषय:', item.healthissue)}
            </View>
        )
    }

    const showRefferals = referralList.length > 0

    return (
        <CustomContainer>
            <CustomHeader title="Referral Details"
                onBackPress={() => navigation.goBack()}
                rightIcon={showRefferals}
                onRightPress={() => sheetRef.current.open()}
            />
            <CustomContent>
                {!showRefferals &&
                    <CustomPicker
                        items={booleanData}
                        label={'क्या किसी किशोर किशोरी  को स्वास्थ सम्बन्धी जाँच /उपचार /परामर्श हेतु रेफर किया गया था।'}
                        placeholder=''
                        {...pickerFieldProps('refer')}
                    />
                }

                {inputs.refer == 2 && renderConsent()}

                {(inputs.refer && !showRefferals) &&
                    <Button title={inputs.refer == 2 ? 'Submit' : 'Add Referral'}
                        onPress={() => {
                            if (inputs.refer == 2) {
                                notAddedReferral()
                            } else {
                                sheetRef.current.open()
                            }
                        }}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                }

                {showRefferals && (
                    <FlatList
                        data={referralList}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                    />
                )}

                {showRefferals && renderConsent()}

                {showRefferals && (
                    <Button
                        title="Submit"
                        onPress={() => onSubmitAll()}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                )}

                <ReusableBottomSheet
                    ref={sheetRef}
                    title="Add Referral Detail"
                    buttonText="Filter"
                    height={450}
                    onClose={() => sheetRef.current.close()}
                >

                    <MyInput label="किशोर/किशोरी का नाम *"
                        {...fieldProps('name')}
                        maxLength={30}
                    />
                    <Text style={[st.error, st.txAlignR]}>
                        {inputs.name?.length || 0}/30
                    </Text>

                    <CustomPicker
                        items={genderData}
                        label={'लिंग *'}
                        placeholder=''
                        {...pickerFieldProps('gender')}
                    />

                    <View>
                        <Text style={st.tx12}>किसको रेफर किया? *</Text>
                        <View style={styles.chkboxContainer}>
                            {referralOptions.map((item) => (
                                <CustomCheckbox
                                    key={item.id}
                                    label={item.label}
                                    checked={selectedReferrals.includes(item.label)}
                                    onChange={() => toggleReferral(item)}
                                />
                            ))}
                        </View>
                    </View>

                    <MyInput label="समस्या/विषय *"
                        {...fieldProps('healthissue')}
                        maxLength={100}
                    />
                    <Text style={[st.error, st.txAlignR]}>
                        {inputs.healthissue?.length || 0}/100
                    </Text>

                    <Button title='Add'
                        onPress={() => onSaveHandle()}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                </ReusableBottomSheet>

            </CustomContent>
        </CustomContainer>
    )
}

export default RefferalDetails

const styles = StyleSheet.create({
    chkboxContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: 10
    }
})