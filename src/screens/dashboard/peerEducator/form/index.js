import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {CustomContainer, CustomContent} from '../../../../components/container'
import CustomHeader from '../../../../components/customHeader'

const PeerEducatorForm = ({navigation}) => {
  return (
    <CustomContainer>
        <CustomHeader title="Peer Educator Reporting" onBackPress={() => navigation.goBack()} />
        <CustomContent>

        </CustomContent>
    </CustomContainer>
  )
}

export default PeerEducatorForm

const styles = StyleSheet.create({})