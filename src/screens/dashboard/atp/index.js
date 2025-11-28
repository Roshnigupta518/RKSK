import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Field from '../../../components/field';
import st from '../../../global/styles';
import EmptyItem from '../../../components/emptyItem';
import { colors } from '../../../global';
import { useAppSelector } from '../../../hooks';

const ATPListScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)

  const activityPlanList = useAppSelector(state => state.activityPlan.data);

  const uniqueList = useMemo(() => {
    const map = new Map();
  
    (activityPlanList || []).forEach(item => {
      map.set(item.atP_Id, item);
    });
  
    const list = [...map.values()];
  
    // 🔥 SORTING LOGIC (newest first)
    list.sort((a, b) => {
      const getDate = (obj) =>
        new Date(
          obj.clockoutTime ||
          obj.clockinTime ||
          obj.visit_Start_Date ||
          obj.createdDate ||
          0
        ).getTime();
  
      return getDate(b) - getDate(a); // Descending
    });
  
    return list;
  }, [activityPlanList]);
  

  useEffect(() => {
    if (activityPlanList) {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [activityPlanList]);

  console.log({uniqueList})

  const getPlanStatus = (item) => {
    const today = new Date().toISOString().split("T")[0];
    const visitDate = item?.visit_Start_Date?.split("T")[0];
    if (!visitDate) return "Pending";
    const visit = new Date(visitDate);
    const current = new Date(today);
    if (item.clockoutTime) return "Completed";
    if (item.clockinTime) return "In Progress";
    if (visitDate === today) return "Pending";
    if (visit > current) return "Scheduled";
    if (visit < current) return "Overdue";
    return "Pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return colors.completed;
      case "In Progress":
        return colors.inprogress;
      case "Pending":
        return colors.pending;
      case "Scheduled":
        return colors.schedule;
      case "Overdue":
        return colors.overdue;
      default:
        return colors.grey;
    }
  };

  const renderItem = ({ item }) => {
    const status = getPlanStatus(item);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ATPLogin', { atP_Id: item.atP_Id, animation: 'none' })}
        style={[st.card]}>
        <View style={st.mt_5} />
        <Text style={styles.title}>{item.visit_Purpose} Activity plan</Text>
        <Field label="Visit Start Date and Time" value={item.visit_Start_Date} />
        <Field label="Visit End Date and Time" value={item.visit_End_Date} />
        <Field label="Asha" value={item.ashaNameEnglish} />
        <Field label="Village" value={item.villageName} />
        <View style={[styles.ribbon, { backgroundColor: getStatusColor(status) }]}>
          <Text style={[st.tx12, { color: colors.white }]}>
            {status}
          </Text>
        </View>

        {(item.clockinTime || item.clockoutTime || item.activity_Id) && (
          <View style={styles.syncContainer}>
            <View style={styles.syncRow}>
              <Text style={styles.syncLabel}>Clock-In:</Text>
              <Text style={[styles.syncStatus, { color: item.clockinSynced ? colors.green : colors.red }]}>
                {item.clockinSynced ? "✔" : "⟳"}
              </Text>
            </View>

            {(item.activity_Id || item.clientId) && (
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>Form:</Text>
                <Text style={[styles.syncStatus, { color: item.formSynced ? colors.green : colors.red }]}>
                  {item.formSynced ? "✔" : "⟳"}
                </Text>
              </View>
            )}

            {item.clockoutTime && (
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>Clock-Out:</Text>
                <Text style={[styles.syncStatus, { color: item.clockoutSynced ? colors.green : colors.red }]}>
                  {item.clockoutSynced ? "✔" : "⟳"}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  };

  return (
    <View style={st.container}>
      <FlatList
        data={uniqueList || []}
        keyExtractor={item => item.atP_Id}
        renderItem={renderItem}
        contentContainerStyle={st.pd20}
        ListEmptyComponent={<EmptyItem isLoading={isLoading} />}
        removeClippedSubviews={false}
      />
    </View>
  );
};

export default ATPListScreen;

const styles = StyleSheet.create({
  title: {
    ...st.tx14,
    ...st.txbold,
    marginBottom: 10,
  },
  ribbon: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 10,
  },
  syncContainer: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    flexDirection:'row',
    justifyContent:'space-between'
  },

  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },

  syncLabel: {
    ...st.tx12,
    marginRight:5
  },

  syncStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
