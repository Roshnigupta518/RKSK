import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useState, useLayoutEffect, useEffect } from 'react'
import st from '../../../global/styles'
import EmptyItem from '../../../components/emptyItem'
import Field from '../../../components/peerField'
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../global'
import { useAppSelector } from '../../../hooks'
import { dateFormat } from '../../../utils/validations'
import IconStatus from '../../../components/iconStatus'

const PeerEducator = ({ navigation }) => {
    const peerEducator = useAppSelector(state => state.peerReferralList.data);
    const [peerEducatorList, setPeerEducatorList] = useState([])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ marginRight: 15, width: 30, height: 30, borderRadius: 50, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon
                        name="plus"
                        size={20}
                        color={colors.black}
                        onPress={() => navigation.navigate('PeerEducatorForm')}
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
                onPress={() => navigation.navigate('PeerDetails', { data: item })}>
                <IconStatus status={item.syncStatus} />
                <Field label={'गतिविधि क्रमांक'} value={item.id} />
                <Field label={'गतिविधि की तारीख'} value={dateFormat(item.activityDate)} />
                <Field label={'ग्राम का नाम'} value={item.villageName} />
                <Field label={'आशा का नाम'} value={item.ashaNameText || item.ashaName} />
                <Field label={'साथिया का नाम'} value={item.sathiyaNameText || item.sathiyaName} />
                {item.id == -1 &&
                    <View style={st.warningBox}>
                        <Icon name="alert-circle" size={16} color="#E59E0B" />
                        <Text style={st.tx12}>
                            {"  Already submitted entry for this date."}
                        </Text>
                    </View>
                }
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

export default PeerEducator
