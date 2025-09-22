import { StyleSheet, Text, View, ImageBackground } from 'react-native'
import React from 'react'
import Logo from '../../../components/logo'
import st from '../../../global/styles'
import ImageConstants from '../../../global/images'

const Splash = () => {
  return (
    <ImageBackground source={ImageConstants.splash} style={st.flex}> 
    
    </ImageBackground>
  )
}

export default Splash

const styles = StyleSheet.create({})