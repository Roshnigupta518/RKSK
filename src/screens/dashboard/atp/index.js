import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../../../components/customHeader';
import Field from '../../../components/field';
import st from '../../../global/styles';

const ATPListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  const data = [
    {
      id: '1',
      title: 'Peer Educator Training',
      startDate: '12/09/2025',
      startTime: '10:30 AM',
      endDate: '12/09/2025',
      endTime: '12:30 PM',
    },
    {
      id: '2',
      title: 'Supportive Supervision Activity',
      startDate: '12/09/2025',
      startTime: '10:30 AM',
      endDate: '12/09/2025',
      endTime: '12:30 PM',
    },
    {
      id: '3',
      title: 'Cluster Meeting',
      startDate: '12/09/2025',
      startTime: '10:30 AM',
      endDate: '12/09/2025',
      endTime: '12:30 PM',
    },
    {
      id: '4',
      title: 'Peer Educator Training',
      startDate: '12/09/2025',
      startTime: '10:30 AM',
      endDate: '12/09/2025',
      endTime: '12:30 PM',
    },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // You can call API here to refresh data
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
    onPress={()=>navigation.navigate('ATPLogin')}
    style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>

      <Field label="Visit Start Date and Time" value={item.startDate} />
      <Field label="Visit End Date and Time" value={item.endDate} />
    </TouchableOpacity>
  );

  return (
    <View style={st.container}>
      <CustomHeader title="ATP List" />
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={st.pd20}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default ATPListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF1F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EEF1F6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    ...st.tx14,
    ...st.txbold,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#777',
    fontSize: 13,
  },
  value: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
  },
});
