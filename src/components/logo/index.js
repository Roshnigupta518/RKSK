import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import ImageConstants from '../../global/images'
import st from '../../global/styles'
import { wp, hp } from '../../global'

const Logo = ({imgsty}) => {
  return (
    <View style={st.align_C}>
      <Image source={ImageConstants.round_logo} 
      style={[imgsty,{width:wp(250), height:hp(100)}]}
       resizeMode={'contain'}  />
    </View>
  )
}

export default Logo

const styles = StyleSheet.create({})