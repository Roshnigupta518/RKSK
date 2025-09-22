import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from '../screens/dashboard/home';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'Home'}>
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  )
}

export default AuthStack

const styles = StyleSheet.create({})