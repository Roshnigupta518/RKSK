// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import {
//   DrawerContentScrollView,
//   DrawerItemList,
//   DrawerItem,
// } from '@react-navigation/drawer';
// import {clearLogin} from '../redux/slices/login'
// import { useDispatch } from 'react-redux';
// import Icon from 'react-native-vector-icons/Feather'
// import { size, family } from '../global';
// const CustomeSidebar = (props) => {

//   const dispatch = useDispatch();

//   return (
//     <DrawerContentScrollView {...props}>
//       <DrawerItemList {...props} />
//       <DrawerItem
//           label={({focused, color}) => (
//             <Text style={{
//               fontSize: size.subtitle,
//           textTransform: 'capitalize', 
//           fontFamily: family.medium, 
//             }}>{'Logout'}</Text>
//           )}
//           icon={({focused, color}) => (
//             <Icon name={'log-out'} size={19} />
//           )}
//           onPress={() => dispatch(clearLogin())}></DrawerItem>
//     </DrawerContentScrollView>
//   )
// }

// export default CustomeSidebar

// const styles = StyleSheet.create({})


import {
  DrawerContentScrollView,
  DrawerItem
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch } from 'react-redux';
import { clearLogin } from '../redux/slices/login';
import { colors, size, family } from '../global';
import st from '../global/styles'

const CustomSidebar = (props) => {
  const dispatch = useDispatch();

  const renderMenuItem = (label, icon, navigateTo, color) => (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={() => props.navigation.navigate(navigateTo)}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={20} color={colors.gray} />
    </TouchableOpacity>
  );

  return (
    <DrawerContentScrollView {...props}>

      {/* -------- Profile Section -------- */}
      <View style={styles.profileBox}>
        <View style={styles.profileAvatar}>
          <Icon name="user" size={32} color={'#FB6F3D'} />
        </View>
        <View style={{marginLeft:10}}>
        <Text style={st.tx16}>Vinayak Mishra</Text>
        <Text style={st.tx14}>Male</Text>
        </View>
      </View>

      {/* -------- Menu Group 1 -------- */}
      <View style={styles.card}>
        {renderMenuItem("Profile", "user", "Dashboard", "#FB6F3D")}
        {renderMenuItem("Dashboard", "grid", "Dashboard", "#413DFB")}
      </View>

      {/* -------- Menu Group 2 -------- */}
      <View style={styles.card}>
        {renderMenuItem("Scheduled Activity", "calendar", "ATPListScreen", "#369BFF")}
        {renderMenuItem("Disclaimer", "alert-triangle", "Disclaimer", "#2AE1E1")}
        {renderMenuItem("Privacy Policy", "lock", "PrivacyPolicy", "#FB6D3A")}
        {/* {renderMenuItem("Notifications", "bell", "Notifications", "#413DFB")} */}
      </View>

      {/* -------- Logout -------- */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => dispatch(clearLogin())}
        >
          <View style={styles.iconBox}>
            <Icon name="log-out" size={20} color={'#FB4A59'} />
          </View>
          <Text style={[styles.menuLabel]}>Log Out</Text>
          <Icon name="chevron-right" size={20} color={colors.gray} />
        </TouchableOpacity>
      </View>

    </DrawerContentScrollView>
  );
};

export default CustomSidebar;

const styles = StyleSheet.create({
  profileBox: {
    padding: 18,
    alignItems: 'flex-start',
    flexDirection:'row'
  },
  profileAvatar: {
    width: 55,
    height: 55,
    borderRadius: 50,
    backgroundColor: '#FFE5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontFamily: family.bold,
  },
  profileSub: {
    fontSize: 14,
    color: 'gray',
    fontFamily: family.medium,
  },

  card: {
    marginHorizontal: 15,
    backgroundColor: '#F5F6FA',
    borderRadius: 14,
    paddingVertical: 5,
    marginBottom: 15,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },

  iconBox: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  menuLabel: {
    fontSize: size.subtitle,
    fontFamily: family.medium,
    flex: 1,
  },
});
