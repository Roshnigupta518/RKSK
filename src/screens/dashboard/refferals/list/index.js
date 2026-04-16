import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useState, useLayoutEffect, useEffect } from 'react'
import st from '../../../../global/styles'
import EmptyItem from '../../../../components/emptyItem'
import Field from '../../../../components/peerField'
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../../global'
import { useAppSelector } from '../../../../hooks'
import { dateFormat } from '../../../../utils/validations'
import IconStatus from '../../../../components/iconStatus'

const RefferalList = ({ navigation }) => {
    const peerEducator = useAppSelector(state => state.ReferralList.data);
    const [peerEducatorList, setPeerEducatorList] = useState([])

    console.log({peerEducator})

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ marginRight: 15, width: 30, height: 30, borderRadius: 50, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon
                        name="plus"
                        size={20}
                        color={colors.black}
                        onPress={() => navigation.navigate('RefferalForm')}
                    />
                </View>
            )
        });
    }, []);

    useEffect(() => {
        setPeerEducatorList(peerEducator);
    }, [peerEducator]);

    const renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity style={st.card} key={index}
                onPress={() => navigation.navigate('RefferalFormDetails', { data: item })}>
                <IconStatus status={item.syncStatus} />
                <Field label={'रेफरल आई डी'} value={item.id || item.refferal_Id} />
                <Field label={'आशा का नाम'} value={item.ashaNameText || item.ashaNameEnglish} />
                <Field label={'साथिया का नाम'} value={item.sathiyaNameText || item.name_of_Peer_Educator_Sathiya} />
                <Field label={'आशा सुपरवाइजर का नाम'} value={item.supervisorNameText || item.ashA_Sahyogi_Name} />
                <Field label={'रेफेर करने की दिनांक'} value={dateFormat(item.activityDate || item.activity_Date)} />
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
        </View>
    )
}

export default RefferalList
