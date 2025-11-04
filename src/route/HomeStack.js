import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from '../screens/dashboard/home';
import ATPForm from '../screens/dashboard/atp/form';
import ATPLogin from '../screens/dashboard/atp/login'
import ATPListScreen from '../screens/dashboard/atp'
import LoginMap from '../screens/dashboard/atp/Map';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { colors, family, size } from '../global';
import CustomeSidebar from './CustomeSidebar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Disclaimer from '../screens/dashboard/disclaimer';
import PrivacyPolicy from '../screens/dashboard/privacyPolicy';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'MainApp'}>
        <Stack.Screen name="MainApp" component={DrawerStack} />
      {/* <Stack.Screen name="Home" component={Home} /> */}
      <Stack.Screen name="ATPListScreen" component={ATPListScreen}  options={{ animation: 'none' }} />
      <Stack.Screen name="ATPForm" component={ATPForm} />
      <Stack.Screen name="ATPLogin" component={ATPLogin} options={{ animation: 'none' }} />
      <Stack.Screen name="LoginMap" component={LoginMap} />
    </Stack.Navigator>
  )
}

const DrawerStack = () => {
  return (
    <Drawer.Navigator
      initialRouteName="ATPListScreen"
      screenOptions={{
        drawerActiveTintColor: colors.blue,
        drawerInactiveTintColor: colors.black,
        drawerLabelStyle: {
          fontSize: size.subtitle,
          textTransform: 'capitalize', 
          fontFamily: family.medium, 
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: size.title,
          textTransform: 'capitalize', 
          fontFamily: family.medium,
        },
      }}
      drawerContent={props => <CustomeSidebar {...props} />}>
      <Drawer.Screen
        name="ATPListScreen"
        options={{
          title:'ATP',
          drawerLabel: 'ATP',
          drawerIcon: ({color}) => <Icon name="home" size={22} color={color} />,
        }}
        component={ATPListScreen}
      />
      <Drawer.Screen
        name="Disclaimer"
        options={{
          drawerLabel: 'Disclaimer',
          drawerIcon: ({color}) => <Icon name="warning" size={22} color={color} />,
        }}
        component={Disclaimer}
      />
       <Drawer.Screen
        name="PrivacyPolicy"
        options={{
          title:'Privacy Policy',
          drawerLabel: 'Privacy Policy',
          drawerIcon: ({color}) => <Icon name="phonelink-lock" size={22} color={color} />,
        }}
        component={PrivacyPolicy}
      />
      </Drawer.Navigator>
  );
};

export default HomeStack

const styles = StyleSheet.create({})