import React,{useEffect} from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { reStartBackgroundService } from '../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../utils/bgservices/backgroundTaskEnum'
import useNetworkStatus from '../../../hooks/networkStatus'

const Dashboard = ({navigation}) => {

    const isConnected = useNetworkStatus();

  const startSync = () => {
    if (isConnected) {
      reStartBackgroundService(syncTaskName.all);
    } 
  };

   useEffect(() => {
    startSync();
  }, [isConnected]);

  useEffect(() => {
    startSync()
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* ---------------- Header Section ---------------- */}
      <LinearGradient
        colors={["#0057A3", "#0079C8"]}
        style={styles.header}
      >
        <View style={styles.headerTopRow} >
          <TouchableOpacity style={styles.menuBtn} onPress={()=> navigation.toggleDrawer()}>
            <Icon name="menu" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>DASHBOARD</Text>

          <TouchableOpacity style={styles.bellBtn}>
            <Icon name="bell" size={22} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ---------------- Cards Section ---------------- */}
      <View style={styles.cardContainer}>
        <View style={styles.row}>
          {renderCard("21", "Activities Completed This Month", "#F56E2B")}
          {renderCard("02", "Activities Scheduled for Today", "#009DC4")}
        </View>

        <View style={styles.row}>
          {renderCard("13", "Overdue Activities", "#073F86")}
          {renderCard("12", "On-Schedule Activities", "#E54747")}
        </View>
      </View>

      {/* ---------------- Bottom Tab ---------------- */}
      <View style={styles.bottomTab}>
        {renderTab("home", "Home", true)}
        {renderTab("heart", "Wishlist")}
        {renderTab("search", "Search")}
        {renderTab("settings", "Setting")}
      </View>
    </View>
  );
};

const renderCard = (count, label, bg) => (
  <View style={[styles.card, { backgroundColor: bg }]}>
    <TouchableOpacity style={styles.cardArrow}>
      <Icon name="arrow-up-right" size={22} color="#fff" />
    </TouchableOpacity>

    <Text style={styles.cardNumber}>{count}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const renderTab = (iconName, title, active = false) => (
  <TouchableOpacity style={styles.tabItem}>
    <Icon
      name={iconName}
      size={24}
      color={active ? "#000" : "#808080"}
    />
    <Text style={[styles.tabText, active && { color: "#000" }]}>{title}</Text>
  </TouchableOpacity>
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
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
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
    height: 170,
    borderRadius: 20,
    padding: 15,
    justifyContent: "flex-start",
  },
  cardArrow: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  cardNumber: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "bold",
  },
  cardLabel: {
    marginTop: 4,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  /* -------- Bottom Tab -------- */
  bottomTab: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  tabItem: { alignItems: "center" },
  tabText: {
    fontSize: 12,
    color: "#808080",
    marginTop: 4,
  },
});
