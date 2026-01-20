import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useState, useLayoutEffect, useEffect } from 'react'
import st from '../../../global/styles'
import EmptyItem from '../../../components/emptyItem'
import Field from '../../../components/peerField'
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../global'
import { useAppSelector } from '../../../hooks'
import { dateFormat } from '../../../utils/validations'

const PeerEducator = ({ navigation }) => {
    const peerEducator = useAppSelector(state => state.peerEducatorList.data);
    const [peerEducatorList, setPeerEducatorList] = useState(peerEducator)

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

    const renderItem = ({ item, index }) => {
        return (
            <TouchableOpacity style={st.card} key={index}
             onPress={()=>navigation.navigate('PeerDetails')}>
                <Field label={'गतिविधि की तारीख'} value={dateFormat(item.activityDate)} />
                <Field label={'ग्राम का नाम'} value={item.villageName} />
                <Field label={'आशा का नाम'} value={item.ashaName} />
                <Field label={'साथिया का नाम'} value={item.sathiyaName} />
            </TouchableOpacity>
        )
    }

    return (
        <View style={st.container}>
            <FlatList
                data={peerEducatorList}
                keyExtractor={(item, index) => index?.toString()}
                renderItem={renderItem}
                contentContainerStyle={st.pd20}
                ListEmptyComponent={() => <EmptyItem />}
                ListHeaderComponent={() =>
                    <Text style={st.tx14}>
                        {`Total ${peerEducatorList.length} records`}
                    </Text>
                }
            />
        </View>
    )
}

export default PeerEducator

const data = [
    { id: 1, date: '20 Dec 2025', village: 'Kolar1', asha: 'Asha Varma1', sathiya: 'Seema sharma1' },
    { id: 2, date: '21 Dec 2025', village: 'Kolar2', asha: 'Asha Varma2', sathiya: 'Seema sharma2' },
    { id: 3, date: '22 Dec 2025', village: 'Kolar3', asha: 'Asha Varma3', sathiya: 'Seema sharma3' },
    { id: 4, date: '23 Dec 2025', village: 'Kolar4', asha: 'Asha Varma4', sathiya: 'Seema sharma4' }
]