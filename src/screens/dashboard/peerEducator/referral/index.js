import { StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useState, useRef } from 'react'
import { CustomContainer, CustomContent } from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'
import CustomPicker from '../../../../components/customPicker'
import { booleanData, referralOptions } from '../../../../utils/constant/staticJson'
import Button from '../../../../components/customButton'
import ReusableBottomSheet from '../../../../components/filterSheet'
import MyInput from '../../../../components/customInput'
import CustomCheckbox from '../../../../components/CustomCheckbox'

const INITIALINPUT = {
    refer: '',
    problem: '',
    gender: '',
    name: ''
}

const RefferalDetails = ({ navigation }) => {
    const [inputs, setInputs] = useState(INITIALINPUT);
    const [errors, setErrors] = useState(INITIALINPUT);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReferrals, setSelectedReferrals] = useState([]);

    const sheetRef = useRef();

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

    return (
        <CustomContainer>
            <CustomHeader title="Referral Details"
                onBackPress={() => navigation.goBack()}
            />
            <CustomContent>
                <CustomPicker
                    items={booleanData}
                    label={'क्या किसी किशोर किशोरी  को स्वास्थ संबंदी जाँच /उपचार /परामर्श हेतु रेफर किया गया था।'}
                    placeholder=''
                    {...pickerFieldProps('refer')}
                />

                {inputs.refer &&
                    <Button title='Add Referral'
                        onPress={() => sheetRef.current.open()}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                }

                <ReusableBottomSheet
                    ref={sheetRef}
                    title="Add Referral Detail"
                    buttonText="Filter"
                    height={450}
                    >

                    <MyInput label="किशोर/किशोरी का नाम"
                        {...fieldProps('name')}
                    />
                    <CustomPicker
                        items={[]}
                        label={'लिंग'}
                        placeholder=''
                        {...pickerFieldProps('gender')}
                    />


                    <View>
                        <Text>किसको रेफर किया?</Text>
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


                    <MyInput label="समस्या/विषय"
                        {...fieldProps('problem')}
                    />

                    <Button title='Add'
                        onPress={() => sheetRef.current.close()}
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
    chkboxContainer:{
        flexDirection: 'row', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        marginVertical: 10 
    }
})