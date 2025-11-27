import React, { useEffect, useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { reStartBackgroundService } from '../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../utils/bgservices/backgroundTaskEnum'
import useNetworkStatus from '../../../hooks/networkStatus'
import colors from '../../../global/theme'
import st from '../../../global/styles'
import { CustomContainer, CustomContent } from '../../../components/container'
import { useFocusEffect } from '@react-navigation/native';
import ExitModal from "../../../components/ExitModal";

const Dashboard = ({ navigation }) => {
  const [exitModal, setExitModal] = useState(false);

  const isConnected = useNetworkStatus();

  // const startSync = () => {
  //   if (isConnected) {
  //     reStartBackgroundService(syncTaskName.all);
  //   }
  // };

  // useEffect(() => {
  //   startSync();
  // }, [isConnected]);

  // useEffect(() => {
  //   startSync()
  // }, [])

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setExitModal(true);
        return true;
      };

      const handler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => handler.remove();
    }, [])
  );

  return (
    <CustomContainer>
      {/* ---------------- Header Section ---------------- */}
      <LinearGradient
        colors={["#0057A3", "#0079C8"]}
        style={styles.header}
      >
        <View style={styles.headerTopRow} >
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.toggleDrawer()}>
            <Icon name="menu" size={22} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Dashboard</Text>

          <View 
          // style={styles.bellBtn}
          >
            {/* <Icon name="bell" size={22} color={colors.white} />
            <View style={styles.badge}>
              <Text style={st.tx10}>2</Text>
            </View> */}
          </View>
        </View>
      </LinearGradient>

      {/* ---------------- Cards Section ---------------- */}
      <View style={styles.cardContainer}>
        <View style={styles.row}>
          {renderCard("21", "Activities\nCompleted\nThis Month", colors.orange)}
          <View style={{ marginTop: 30, width: '100%', marginLeft: 25 }}>
            {renderCard("02", "Activities\nScheduled\nfor Today", colors.skyblue)}
          </View>
        </View>

        <View style={styles.row}>
          {renderCard("13", `Overdue\nActivities`, colors.blue)}
          <View style={{ marginTop: 30, width: '100%', marginLeft: 25 }}>
            {renderCard("12", "On-Schedule\nActivities", colors.red)}
          </View>
        </View>
      </View>

      <ExitModal
        visible={exitModal}
        title="Exit From RKSK MP"
        message="Are you sure you want to close this application?"
        confirmText="Exit"
        cancelText="Cancel"
        onCancel={() => setExitModal(false)}
        onConfirm={() => {
          setExitModal(false);
          BackHandler.exitApp();
        }}
      />

    </CustomContainer>
  );
};

const renderCard = (count, label, bg) => (
  <View style={[styles.card, { backgroundColor: bg }]}>
    <TouchableOpacity style={styles.cardArrow}>
      <Icon name="arrow-up-right" size={20} color="#fff" />
    </TouchableOpacity>

    <View style={st.mt_10}>
      <Text style={styles.cardNumber}>{count}</Text>

      <View style={st.bordersty} />

      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  </View>
);

export default Dashboard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* -------- Header -------- */
  header: {
    height: 250,
    width: "100%",
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingTop: 50,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  menuBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 40,
  },
  bellBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 40,
  },
  headerTitle: {
    ...st.tx18,
    color: colors.white,
    letterSpacing: 1,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF5733",
    width: 18,
    height: 18,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    ...st.tx10
  },

  /* -------- Cards -------- */
  cardContainer: {
    marginTop: -90,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  card: {
    width: "47%",
    height: 230,
    borderRadius: 20,
    padding: 15,
    justifyContent: "flex-start",
  },
  cardArrow: {
    position: "absolute",
    right: 15,
    top: 15,
    width: 40,
    height: 40,
    borderColor: colors.disabled,
    borderWidth: 1,
    borderRadius: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardNumber: {
    fontSize: 36,
    color: "#fff",
    ...st.txbold
  },
  cardLabel: {
    marginTop: 4,
    ...st.tx14,
    color: colors.white,
    lineHeight: 28,
    ...st.txbold,
    letterSpacing: 1
  },

});
