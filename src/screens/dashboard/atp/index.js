import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Field from '../../../components/field';
import st from '../../../global/styles';
import { getATPListRequest } from '../../../utils/services';
import EmptyItem from '../../../components/emptyItem';

const ATPListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const getATPDataHandle = async () => {
    try {
      setIsLoading(true);
      const result = await getATPListRequest();
      console.log('ATP Result:', result);
      if (Array.isArray(result)) {
        setData(result);
      } else {
        console.warn('Unexpected data format:', result);
        setData([]);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    getATPDataHandle()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      getATPDataHandle()
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ATPLogin')}
      style={st.card}>
      <Text style={styles.title}>{item.visit_Purpose}</Text>
      <Field label="Visit Start Date and Time" value={item.visit_Start_Date} />
      <Field label="Visit End Date and Time" value={item.visit_End_Date} />
    </TouchableOpacity>
  );

  return (
    <View style={st.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.atP_Id}
        renderItem={renderItem}
        contentContainerStyle={st.pd20}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<EmptyItem isLoading={isLoading} />}
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
});
