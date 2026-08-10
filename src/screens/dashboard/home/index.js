import React, { useEffect, useCallback, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ScrollView, RefreshControl } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import colors from '../../../global/theme'
import st from '../../../global/styles'
import { CustomContainer } from '../../../components/container'
import { useFocusEffect } from '@react-navigation/native';
import ExitModal from "../../../components/ExitModal";
import { useAppSelector } from "../../../hooks";
import { calculateDashboardCounts } from "../../../utils/helper";
import { reStartBackgroundService } from "../../../utils/bgservices/backgroundService";
import { syncTaskName } from "../../../utils/bgservices/backgroundTaskEnum";

const Dashboard = ({ navigation }) => {
  const [exitModal, setExitModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false)

  const activityPlanList = useAppSelector(state => state.activityPlan.data);
  const magList = useAppSelector(state => state.iecMaterialList.data);
  const awarenessVideoList = useAppSelector(state => state.awarenessVideoList.data);
  const onBoarding = useAppSelector(state => state.login.data);

  const dashboardCounts = useMemo(() => {
    return calculateDashboardCounts(activityPlanList);
  }, [activityPlanList]);

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

  const renderCard = (count, label, bg, onPress) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, { backgroundColor: bg }]}
    >
      <View style={styles.cardArrow}>
        <Icon name="arrow-up-right" size={20} color="#fff" />
      </View>
  
      <View 
      // style={st.mt_10}
      >
        <Text style={styles.cardNumber}>{count}</Text>
  
        <View style={st.bordersty} />
  
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const handleRefresh = () => {
    reStartBackgroundService(syncTaskName.all)
  }

  return (
    <CustomContainer>
      {/* ---------------- Header Section ---------------- */}
      <ScrollView style={st.flex} 
       refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      >
      <LinearGradient
        colors={["#0057A3", "#0079C8"]}
        style={styles.header}
      >
        <View style={styles.headerTopRow} >
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.toggleDrawer()}>
            <Icon name="menu" size={22} color={colors.black} />
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
      {onBoarding.trainerId != '0' &&
        <>
        <View style={styles.row}>
          {renderCard(dashboardCounts?.completedThisMonth, 
            "Activities\nCompleted\nThis Month", 
            colors.orange,
            () => navigation.navigate("FilteredList", { filterType: "COMPLETED" })
            )}
          <View style={{ marginTop: 20, width: '100%', marginLeft: 25 }}>
            {renderCard(dashboardCounts?.scheduledToday, "Activities\nScheduled\nfor Today", colors.skyblue,
              () => navigation.navigate("FilteredList", { filterType: "TODAY" })
            )}
          </View>
        </View>

        <View style={styles.row}>
          {renderCard(dashboardCounts?.overdue, `Overdue\nActivities`, colors.blue,
            () => navigation.navigate("FilteredList", { filterType: "OVERDUE" })
          )}
          <View style={{ marginTop: 20, width: '100%', marginLeft: 25 }}>
            {renderCard(dashboardCounts?.onSchedule, "On-Schedule\nActivities", colors.red,
                () => navigation.navigate("FilteredList", { filterType: "SCHEDULED" })
            )}
          </View>
        </View>
        </>
      }

        <View style={styles.row}>
          {renderCard(magList?.length, `IEC Materials`, colors.orange,
            () => navigation.navigate("Materials")
          )}
          <View style={{ marginTop: 20, width: '100%', marginLeft: 25 }}>
            {renderCard(awarenessVideoList?.length, "Awareness Videos", colors.skyblue,
                () => navigation.navigate("AwarenessVideo")
            )}
          </View>
        </View>

      </View>
      </ScrollView>
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
    backgroundColor: colors.white,
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
    height: 200,
    borderRadius: 20,
    padding: 15,
    justifyContent: "flex-start",
  },
  cardArrow: {
    position: "absolute",
    right: 15,
    top: 5,
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
    // marginTop: 4,
    ...st.tx14,
    color: colors.white,
    lineHeight: 28,
    ...st.txbold,
    letterSpacing: 1
  },

});
