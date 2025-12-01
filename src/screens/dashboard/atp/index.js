import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import st from '../../../global/styles';
import EmptyItem from '../../../components/emptyItem';
import { useAppSelector } from '../../../hooks';
import AcitivityComponent from '../../../components/AcitivityComponent';

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

  console.log({ uniqueList })

  const renderItem = ({ item }) => {
    return (
      <AcitivityComponent item={item}
        onPress={() => navigation.navigate('ATPLogin', { atP_Id: item.atP_Id, animation: 'none' })}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },

  syncLabel: {
    ...st.tx12,
    marginRight: 5
  },

  syncStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
