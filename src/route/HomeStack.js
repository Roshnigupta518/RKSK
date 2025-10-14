import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from '../screens/dashboard/home';
import ATPForm from '../screens/dashboard/atp/form';
import ATPLogin from '../screens/dashboard/atp/login'
import ATPListScreen from '../screens/dashboard/atp'
import LoginMap from '../screens/dashboard/atp/Map';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'ATPListScreen'}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="ATPListScreen" component={ATPListScreen} />
      <Stack.Screen name="ATPForm" component={ATPForm} />
      <Stack.Screen name="ATPLogin" component={ATPLogin} />
      <Stack.Screen name="LoginMap" component={LoginMap} />
    </Stack.Navigator>
  )
}

export default AuthStack

const styles = StyleSheet.create({})