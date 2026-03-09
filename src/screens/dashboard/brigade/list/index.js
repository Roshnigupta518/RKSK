import { StyleSheet, Text, View, FlatList, TouchableOpacity, } from 'react-native'
import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react'
import st from '../../../../global/styles'
import EmptyItem from '../../../../components/emptyItem'
import Field from '../../../../components/peerField'
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../../global'
import { useAppSelector } from '../../../../hooks'
import { dateFormat } from '../../../../utils/validations'
import IconStatus from '../../../../components/iconStatus'
import CustomDatePicker from '../../../../components/CustomDatePicker'
import MyInput from '../../../../components/customInput'
import ReusableBottomSheet from '../../../../components/filterSheet'

const INITIALINPUT = {

}

const BrigadeList = ({ navigation }) => {
    const peerEducator = useAppSelector(state => state.peerReferralList.data);
    const [peerEducatorList, setPeerEducatorList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [inputs, setInputs] = useState(INITIALINPUT);
    const [errors, setErrors] = useState(INITIALINPUT);

    const sheetRef = useRef();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ marginRight: 15, width: 30, height: 30, borderRadius: 50, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon
                        name="plus"
                        size={20}
                        color={colors.black}
                        onPress={() => navigation.navigate('BrigadeForm')}
                    />
                </View>
            )
        });
    }, []);

    useEffect(() => {
        setPeerEducatorList(peerEducator);
    }, [peerEducator]);


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

    const pickerFieldProps = (field) => ({
        selectedValue: inputs[field],
        error: errors[field],
        onValueChange: (val) => {
            handleOnchange(field)(val);
            handleError(field);
        },
        disabled: isLoading,
    });

    const dateFieldProps = (field, mode = 'date') => ({
        value: inputs[field] ? new Date(inputs[field]) : null,
        error: errors[field],
        mode,
        onChange: (val) => {
            handleOnchange(field)(val.toISOString());
            if (errors[field]) handleError('', field);
        },
        disabled: isLoading,
    });

    const onFilterApplyPress = () => {
        // const result = applyFilters();
        // setFilteredList(result);
        // setIsFilterPressed(true);   // user actually applied filter
        sheetRef.current.close();
    };

    const clearFilters = () => {
        setInputs(INITIALINPUT);
        setFilteredList([]);
        setIsFilterPressed(false);   //  filter removed
        sheetRef.current.close();
    };


    const renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity style={st.card} key={index}
                onPress={() => navigation.navigate('BrigadeDetails', { data: item })}>
                <IconStatus status={item.syncStatus} />
                <Field label="Id" value={item.id} />
                <Field label={'District/जिला'} value={item.ashaNameText || item.ashaName} />
                <Field label={'ASHA/आशा का नाम'} value={item.villageName} />
                <Field label={'Village/ग्राम का नाम'} value={item.sathiyaNameText || item.sathiyaName} />
                <Field label={'Peer educator/साथिया का नाम'} value={item.id} />
                <Field label={'Name/ब्रिगेड सदस्य का नाम'} value={dateFormat(item.activityDate)} />
                <Field label="Registration Date" value={item.locationText || item.location} />

            </TouchableOpacity>
        )
    }

    return (
        <View style={st.container}>
            <FlatList
                data={peerEducatorList}
                keyExtractor={(item) => item.clientId || item.id?.toString()}
                renderItem={renderItem}
                contentContainerStyle={st.pd20}
                ListEmptyComponent={() => <EmptyItem />}
                ListHeaderComponent={() =>
                    peerEducatorList.length > 0 &&
                    <Text style={st.tx14}>
                        {`Total ${peerEducatorList.length} records`}
                    </Text>
                }
            />

            <View style={st.floatingbtn}>
                <Icon
                    name="sliders"
                    size={20}
                    color={colors.white}
                    onPress={() => sheetRef.current.open()}
                />
            </View>

            <ReusableBottomSheet
                ref={sheetRef}
                title="Filter Brigade List"
                buttonText="Filter"
                height={450}
                onButtonPress={onFilterApplyPress}
                footerExtraButton={{
                    label: "Clear Filter",
                    onPress: clearFilters,
                }}
                onClose={() => sheetRef.current.close()}
            >

                <MyInput label="Brigade Name"
                    {...fieldProps('name')}
                />
                <MyInput label="Brigade Mobile Number"
                    {...fieldProps('mobile')}
                />

                <CustomDatePicker
                    label="From Date"
                    placeholder=""
                    iconName="calendar"
                    {...dateFieldProps('fromdate', 'date')}
                />

                <CustomDatePicker
                    label="To Date"
                    placeholder=""
                    iconName="calendar"
                    {...dateFieldProps('todate', 'date')}
                />

            </ReusableBottomSheet>
        </View>
    )
}

export default BrigadeList
