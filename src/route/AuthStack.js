import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from '../screens/auth/login'

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'Login'}>
    <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  )
}

export default AuthStack

const styles = StyleSheet.create({})