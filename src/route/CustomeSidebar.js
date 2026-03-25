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
import {persistor, store} from '../redux/store';
import { ENUM } from '../utils/bgservices/enum';

const CustomSidebar = (props) => {
  const dispatch = useDispatch();
  const [logoutModal, setLogoutModal] = useState(false);
  const onBoarding = useSelector(state => state.login.data);
  const currentRoute = props.state.routeNames[props.state.index];

  const renderMenuItem = (label, icon, navigateTo, color) => {
    const isActive = currentRoute === navigateTo;
  
    return (
      <TouchableOpacity
        style={[
          styles.menuRow,
          {
            backgroundColor: isActive ? colors.blue : 'transparent',
            borderRadius: 10,
          },
        ]}
        onPress={() => props.navigation.navigate(navigateTo)}
      >
        <View style={styles.iconBox}>
          <Icon
            name={icon}
            size={20}
            color={ color}
          />
        </View>
  
        <Text
          style={[
            styles.menuLabel,
            { color: isActive ? colors.white : colors.black },
          ]}
        >
          {label}
        </Text>
  
        <Icon
          name="chevron-right"
          size={20}
          color={isActive ? colors.white : colors.gray}
        />
      </TouchableOpacity>
    );
  };

  const useHasPendingSync = () => {
    const activityQueue = useSelector(state => state.queue?.pending || []);
    const peerReferralQueue = useSelector(state => state.peerReferralList?.data || []);

    return (
      activityQueue?.length > 0 ||
      peerReferralQueue.some(i => i.syncStatus !== ENUM.SERVERSTATUS.COMPLETED)
    );
  };

  const hasPendingSync = useHasPendingSync();

  const logoutMessage = hasPendingSync
  ? "Some data is not synced yet. If you logout now, your offline data will be permanently deleted. Please make sure your data is synced before logout."
  : "Are you sure you want to logout?";

  
  const handleConfirm = () => {
    dispatch(clearLogin())
    setLogoutModal(false);
     
  store.dispatch({ type: 'RESET_ALL' });

  persistor.purge().then(() => {
    console.log('🔁 Persisted storage purged!');
    // Navigate to login or reset app state
  });

  props.navigation.closeDrawer();
  };

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
        {renderMenuItem("IEC Materials", "file", "Materials", colors.yellow)}
        {renderMenuItem("Awareness Video", "video", "AwarenessVideo", 'green')}
      </View>

      {/* -------- Menu Group 2 -------- */}
      <View style={styles.card}>
        {renderMenuItem("Manage Activity", "calendar", "ATPListScreen", "#369BFF")}
        {renderMenuItem("Peer Educator Reporting", "command", "PeerEducator", "#2AE1E1")}
        {/* {renderMenuItem("Peer Educator Brigade", "codepen", "BrigadeList", "#2AE1E1")} */}
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
        message={logoutMessage}
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutModal(false)}
        onConfirm={handleConfirm}/>


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
