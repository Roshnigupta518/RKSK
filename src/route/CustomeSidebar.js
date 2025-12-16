import {
  DrawerContentScrollView,
  DrawerItem
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { clearLogin } from '../redux/slices/login';
import { colors, size, family, wp, hp } from '../global';
import st from '../global/styles'
import ConfirmPopup from '../components/ExitModal';
import { useState } from 'react';

const CustomSidebar = (props) => {
  const dispatch = useDispatch();
  const [logoutModal, setLogoutModal] = useState(false);
  const onBoarding = useSelector(state => state.login.data);

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
        <View style={st.wdh25}>
        <View style={styles.profileAvatar}>
          <Icon name="user" size={30} color={'#FB6F3D'} />
        </View>
        </View>
        <View style={st.wdh75}>
          <Text style={st.tx16} numberOfLines={1}>{onBoarding.email}</Text>
          <Text style={st.tx14}>{onBoarding.role}</Text>
        </View>
      </View>

      {/* -------- Menu Group 1 -------- */}
      <View style={styles.card}>
        {renderMenuItem("Profile", "user", "Profile", "#FB6F3D")}
        {renderMenuItem("Dashboard", "grid", "Dashboard", "#413DFB")}
      </View>

      {/* -------- Menu Group 2 -------- */}
      <View style={styles.card}>
        {renderMenuItem("Manage Activity", "calendar", "ATPListScreen", "#369BFF")}
        {/* {renderMenuItem("Peer Educator Reporting", "command", "PeerEducator", "#2AE1E1")} */}
        {renderMenuItem("Disclaimer", "alert-triangle", "Disclaimer", "#FB6D3A")}
        {renderMenuItem("Privacy Policy", "lock", "PrivacyPolicy", "#FB6D3A")}
        {/* {renderMenuItem("Notifications", "bell", "Notifications", "#413DFB")} */}
      </View>

      {/* -------- Logout -------- */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setLogoutModal(true)}
        >
          <View style={styles.iconBox}>
            <Icon name="log-out" size={20} color={'#FB4A59'} />
          </View>
          <Text style={[styles.menuLabel]}>Log Out</Text>
          <Icon name="chevron-right" size={20} color={colors.gray} />
        </TouchableOpacity>
      </View>

      <ConfirmPopup
        visible={logoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutModal(false)}
        onConfirm={() => {
          setLogoutModal(false);
          dispatch(clearLogin());
          props.navigation.closeDrawer();
        }}
      />


    </DrawerContentScrollView>
  );
};

export default CustomSidebar;

const styles = StyleSheet.create({
  profileBox: {
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row'
  },
  profileAvatar: {
    width: wp(55),
    height: wp(55),
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
