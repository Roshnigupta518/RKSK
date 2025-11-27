import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import Field from '../../../components/field';
import st from '../../../global/styles';
import { getATPListRequest } from '../../../utils/services';
import EmptyItem from '../../../components/emptyItem';
import { colors } from '../../../global';
import { useIsFocused, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../../../hooks';

const ATPListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const activityPlanList = useAppSelector(state => state.activityPlan.data);

  const isFocused = useIsFocused();
  const route = useRoute();

  console.log({activityPlanList})

  // useEffect(() => {
  //   if (isFocused && route.params?.refresh) {
  //     getATPDataHandle(); // your API call
  //     // Clear the refresh flag so it doesn’t repeat
  //     navigation.setParams({ refresh: false });
  //   }
  // }, [isFocused, route.params?.refresh]);

  // const getATPDataHandle = async () => {
  //   try {
  //     setIsLoading(true);
  //     const result = await getATPListRequest();
  //     console.log('ATP Result:', result);
  //     if (Array.isArray(result)) {
  //       setData(result);
  //     } else {
  //       console.warn('Unexpected data format:', result);
  //       setData([]);
  //     }
  //   } catch (e) {
  //     console.log('ATP_LIST', e)
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   getATPDataHandle()
  // }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      getATPDataHandle()
      setRefreshing(false);
    }, 1500);
  }, []);

  const changedBgColor = (activity_Id, clockinTime) => {
    if (activity_Id) {
      return colors.green
    } else if(clockinTime) {
      return colors.yellow
    }else{
      return colors.red
    }
  }

  const getPlanStatus = (item) => {
    const today = new Date().toISOString().split("T")[0];  // YYYY-MM-DD
    const visitDate = item?.visit_Start_Date?.split("T")[0];
  
    if (!visitDate) return "Pending";
  
    const visit = new Date(visitDate);
    const current = new Date(today);
  
    // Completed
    if (item.activity_Id) return "Completed";
  
    // In progress
    if (item.clockinTime) return "In Progress";
  
    // Date checks
    if (visitDate === today) return "Pending";
  
    if (visit > current) return "Scheduled";
  
    // visit < today
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
    return(
    <TouchableOpacity
      onPress={() => navigation.navigate('ATPLogin', { activiyDetails: item, animation: 'none' })}
      style={[st.card]}>
      <View style={st.mt_5} />
      <Text style={styles.title}>{item.visit_Purpose} Activity plan</Text>
      <Field label="Visit Start Date and Time" value={item.visit_Start_Date} />
      <Field label="Visit End Date and Time" value={item.visit_End_Date} />
      <Field label="Asha" value={item.ashaNameEnglish} />
      <Field label="Village" value={item.villageName} />

      {/* <View style={[styles.ribbon, { backgroundColor: changedBgColor(item.activity_Id, item.clockinTime) }]}>
        <Text style={[st.tx12, { color: colors.white }]}>
          {item.activity_Id? 'Completed': item.clockinTime? 'In Progress': 'Pending'}
        </Text>
      </View> */}

     <View style={[styles.ribbon, { backgroundColor: getStatusColor(status) }]}>
        <Text style={[st.tx12, { color: colors.white }]}>
          {status}
        </Text>
      </View>

    </TouchableOpacity>
  )};

  return (
    <View style={st.container}>
      <FlatList
        data={activityPlanList || []}
        keyExtractor={item => item.atP_Id}
        renderItem={renderItem}
        contentContainerStyle={st.pd20}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
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
    borderBottomLeftRadius:10,
    paddingHorizontal: 10,
  },
});
