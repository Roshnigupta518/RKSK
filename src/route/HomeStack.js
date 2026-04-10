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
import PeerEducatorForm from '../screens/dashboard/peerEducator/form';
import RefferalDetails from '../screens/dashboard/peerEducator/referral';
import PeerDetails from '../screens/dashboard/peerEducator/peerDetail';
import BrigadeForm from '../screens/dashboard/brigade/form';
import BrigadeList from '../screens/dashboard/brigade/list';
import BrigadeDetails from '../screens/dashboard/brigade/details';
import Materials from '../screens/dashboard/materials';
import ViewPdf from '../screens/dashboard/ViewPdf';
import AwarenessVideo from '../screens/dashboard/videos';
import ViewVdo from '../screens/dashboard/ViewVdo';
import Tracking from '../screens/dashboard/tracking';
import RefferalList from '../screens/dashboard/refferals/list';
import RefferalForm from '../screens/dashboard/refferals/form';
import RefferalFormDetails from '../screens/dashboard/refferals/details'

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
      <Stack.Screen name="PeerEducatorForm" component={PeerEducatorForm} />
      <Stack.Screen name="RefferalDetails" component={RefferalDetails} />
      <Stack.Screen name="PeerDetails" component={PeerDetails} />
      <Stack.Screen name="BrigadeForm" component={BrigadeForm} />
      <Stack.Screen name="BrigadeDetails" component={BrigadeDetails} />
      <Stack.Screen name="ViewPdf" component={ViewPdf} />
      <Stack.Screen name="ViewVdo" component={ViewVdo} />
      <Stack.Screen name="Tracking" component={Tracking} />
      <Stack.Screen name="RefferalForm" component={RefferalForm} />
      <Stack.Screen name="RefferalFormDetails" component={RefferalFormDetails} />
      {/* RefferalFormDetails */}
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
        }}
        component={Home}
      />
      <Drawer.Screen
        name="Profile"
        options={{
          title: 'Profile',
          drawerLabel: 'Profile',
        }}
        component={Profile}
      />
      <Drawer.Screen
        name="Materials"
        options={{
          title: 'IEC Materials',
          drawerLabel: 'IEC Materials',
        }}
        component={Materials}
      />
      <Drawer.Screen
        name="AwarenessVideo"
        options={{
          title: 'Awareness Videos',
          drawerLabel: 'Awareness Videos',
        }}
        component={AwarenessVideo}
      />
      <Drawer.Screen
        name="ATPListScreen"
        options={{
          title: 'Activity Tour plan',
          drawerLabel: 'ATP',
        }}
        component={ATPListScreen}
      />
       <Drawer.Screen
        name="PeerEducator"
        options={{
          title: 'Peer Educator',
          drawerLabel: 'Peer Educator',
        }}
        component={PeerEducator}
      />
       <Drawer.Screen
        name="BrigadeList"
        options={{
          title: 'Brigade List',
          drawerLabel: 'Peer Educator Brigade',
        }}
        component={BrigadeList}
      />
      <Drawer.Screen
        name="RefferalList"
        options={{
          title: 'Refferal List',
          drawerLabel: 'Refferal List',
        }}
        component={RefferalList}
      />
      <Drawer.Screen
        name="Disclaimer"
        options={{
          drawerLabel: 'Disclaimer',
        }}
        component={Disclaimer}
      />
      <Drawer.Screen
        name="PrivacyPolicy"
        options={{
          title: 'Privacy Policy',
          drawerLabel: 'Privacy Policy',
        }}
        component={PrivacyPolicy}
      />
    </Drawer.Navigator>
  );
};

export default HomeStack
