import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from '../screens/auth/login'
import Disclaimer from '../screens/dashboard/disclaimer'
import { useAppSelector } from '../hooks'
const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const disclaimerStatus = useAppSelector(state => state.disclaimerStatus.data); 
  console.log({disclaimerStatus})
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={disclaimerStatus ?'Login': 'Disclaimer'}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Disclaimer" component={Disclaimer} />
    </Stack.Navigator>
  )
}

export default AuthStack

const styles = StyleSheet.create({})