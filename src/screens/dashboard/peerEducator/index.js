import { StyleSheet, Text, View, FlatList } from 'react-native'
import React, { useState, useLayoutEffect } from 'react'
import st from '../../../global/styles'
import EmptyItem from '../../../components/emptyItem'
import Field from '../../../components/peerField'
import Icon from 'react-native-vector-icons/Feather'
import { colors } from '../../../global'

const PeerEducator = ({ navigation }) => {
    const [peerEducatorList, setPeerEducatorList] = useState(data)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ marginRight: 15, width: 30, height: 30, borderRadius: 50, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon
                        name="plus"
                        size={20}
                        color={colors.black}
                    //   onPress={() => sheetRef.current.open()}
                    />
                </View>
            )
        });
    }, []);

    const renderItem = ({ item, index }) => {
        return (
            <View style={st.card} key={index}>
                <Field label={'गतिविधि की तारीख'} value={item.date} />
                <Field label={'ग्राम का नाम'} value={item.village} />
                <Field label={'आशा का नाम'} value={item.asha} />
                <Field label={'साथिया का नाम'} value={item.sathiya} />
            </View>
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