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

const INITIALINPUT = {
    refer: '',
    problem: '',
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
    const dispatch = useAppDispatch()

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
                id: Date.now().toString(),
                name: inputs.name,
                gender: inputs.gender,
                problem: inputs.problem,
                referrals: selectedReferrals,
            };

            setReferralList(prev => [...prev, newItem]);

            // reset bottom sheet form
            setInputs(INITIALINPUT);
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

        if (!inputs.problem?.trim()) {
            newErrors.problem = 'Required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onSubmitAll = () => {
        if (!isChecked) {
            showConsentError()
            return;
        }

        const payload = {
            ...data,
            refer: inputs.refer,
            referrals: referralList,
            clientId: generateclientID(userLogin.userId),
            syncStatus: ENUM.SERVERSTATUS.NOTSTARTED,
            createdAt: new Date().toISOString(),
            retryCount: 0,
        };

        dispatch(setPeerReferralList(payload));
        startBackgroundService(syncTaskName.syncPeerEducatorFormData)
        console.log('FINAL DATA:', payload);

        // Example navigation
        navigation.navigate('MainApp', {
            screen: 'PeerEducator',
            params: { referrals: payload },
        });
    };

    const notAddedReferral = () => {

        if (!isChecked) {
            showConsentError()
            return;
        }

        const payload = {
            ...data,
            refer: inputs.refer,
            referrals: [],
            clientId: generateclientID(userLogin.userId),
            syncStatus: ENUM.SERVERSTATUS.NOTSTARTED,
            createdAt: new Date().toISOString(),
            retryCount: 0,
        };

        dispatch(setPeerReferralList(payload));

        startBackgroundService(syncTaskName.syncPeerEducatorFormData)

        navigation.navigate('MainApp', {
            screen: 'PeerEducator',
        });
    }

    const renderText = (label, value) => {
        return (
            <Text style={[st.tx12, { marginTop: 5 }]}>{label}<Text style={st.txbold}>{value}</Text></Text>
        )
    }

    const renderItem = ({ item, index }) => {
        return (
            <View style={st.card} key={index}>
                {renderText('किशोर/किशोरी का नाम:', item.name)}
                {renderText('लिंग:', getLabelsFromValues(item.gender, genderData))}
                {renderText('किसको रेफर किया:', item.referrals.join(', '))}
                {renderText('समस्या/विषय:', item.problem)}
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
                        label={'क्या किसी किशोर किशोरी  को स्वास्थ संबंदी जाँच /उपचार /परामर्श हेतु रेफर किया गया था।'}
                        placeholder=''
                        {...pickerFieldProps('refer')}
                    />
                }

                {inputs.refer == 2 && renderConsent()}

                {inputs.refer &&
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
                    height={450}>

                    <MyInput label="किशोर/किशोरी का नाम *"
                        {...fieldProps('name')}
                    />

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
                        {...fieldProps('problem')}
                    />

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