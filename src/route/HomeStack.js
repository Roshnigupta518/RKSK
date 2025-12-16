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
import Profile from '../screens/dashboard/profile';
import FilteredList from '../screens/dashboard/atp/FilteredList';
import PeerEducator from '../screens/dashboard/peerEducator';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false,  animation: 'none', }}
      initialRouteName={'MainApp'}>
      <Stack.Screen name="MainApp" component={DrawerStack} />
      <Stack.Screen name="ATPForm" component={ATPForm} />
      <Stack.Screen name="ATPLogin" component={ATPLogin} options={{ animation: 'none' }} />
      <Stack.Screen name="LoginMap" component={LoginMap} />
      <Stack.Screen name="FilteredList" component={FilteredList} />
    </Stack.Navigator>
  )
}

const DrawerStack = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
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
        headerStyle: {
          backgroundColor: colors.blue, 
        },
        headerTintColor: colors.white,
      }}
      drawerContent={props => <CustomeSidebar {...props} />}>

      <Drawer.Screen
        name="Dashboard"
        options={{
          headerShown: false,
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => <Icon name="home" size={22} color={color} />,
        }}
        component={Home}
      />
      <Drawer.Screen
        name="Profile"
        options={{
          title: 'Profile',
          drawerLabel: 'Profile',
          drawerIcon: ({ color }) => <Icon name="home" size={22} color={color} />,
        }}
        component={Profile}
      />
      <Drawer.Screen
        name="ATPListScreen"
        options={{
          title: 'Activity Tour plan',
          drawerLabel: 'ATP',
          drawerIcon: ({ color }) => <Icon name="home" size={22} color={color} />,
        }}
        component={ATPListScreen}
      />
       <Drawer.Screen
        name="PeerEducator"
        options={{
          title: 'Peer Educator',
          drawerLabel: 'Peer Educator',
          drawerIcon: ({ color }) => <Icon name="home" size={22} color={color} />,
        }}
        component={PeerEducator}
      />
      <Drawer.Screen
        name="Disclaimer"
        options={{
          drawerLabel: 'Disclaimer',
          drawerIcon: ({ color }) => <Icon name="warning" size={22} color={color} />,
        }}
        component={Disclaimer}
      />
      <Drawer.Screen
        name="PrivacyPolicy"
        options={{
          title: 'Privacy Policy',
          drawerLabel: 'Privacy Policy',
          drawerIcon: ({ color }) => <Icon name="phonelink-lock" size={22} color={color} />,
        }}
        component={PrivacyPolicy}
      />
    </Drawer.Navigator>
  );
};

export default HomeStack
