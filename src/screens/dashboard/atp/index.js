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
import { colors } from '../../../global';
import { useIsFocused, useRoute } from '@react-navigation/native';

const ATPListScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const isFocused = useIsFocused();
  const route = useRoute();

  useEffect(() => {
    if (isFocused && route.params?.refresh) {
      getATPDataHandle(); // your API call
      // Clear the refresh flag so it doesn’t repeat
      navigation.setParams({ refresh: false });
    }
  }, [isFocused, route.params?.refresh]);

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
      console.log('ATP_LIST', e)
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

  const changedBgColor = (activity_Id)=>{
    if(activity_Id){
      return colors.green
    } else {
      return colors.red
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ATPLogin',{activiyDetails: item, animation: 'none' })}
      style={[st.card,{
        // backgroundColor: item.activity_Id ? colors.lightGrey : colors.white
      }]}>
      <Text style={styles.title}>{item.visit_Purpose}</Text>
      <Field label="Visit Start Date and Time" value={item.visit_Start_Date} />
      <Field label="Visit End Date and Time" value={item.visit_End_Date} />
      <View style={[styles.ribbon,{backgroundColor:changedBgColor(item.activity_Id)}]}>
        <Text style={[st.tx12,{color:colors.white}]}>
          {item.activity_Id ? 'Completed' : 'Pending'}
        </Text>
      </View>
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
  ribbon: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    paddingHorizontal:10,
  },
});
