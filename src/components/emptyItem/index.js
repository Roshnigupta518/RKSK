import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React from 'react'
import st from '../../global/styles'
import { colors } from '../../global'

const EmptyItem = ({ isLoading }) => {
    return (
        <View style={[st.center, { marginTop: '50%' }]}>
            {isLoading ? (
                <ActivityIndicator size={'large'} color={colors.blue} />
            ) :
                <Text style={st.tx14}>Data not found</Text>
            }
        </View>
    )
}

export default EmptyItem

const styles = StyleSheet.create({})