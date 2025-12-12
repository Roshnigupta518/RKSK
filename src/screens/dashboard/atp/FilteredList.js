import { StyleSheet, FlatList, BackHandler, Text } from 'react-native'
import React, { useMemo, useState, useEffect } from 'react'
import { CustomContainer } from '../../../components/container'
import EmptyItem from '../../../components/emptyItem'
import AcitivityComponent from '../../../components/AcitivityComponent'
import { useAppSelector } from '../../../hooks'
import { getPlanStatus, parseDDMMYYYY } from '../../../utils/helper'
import CustomHeader from '../../../components/customHeader'
import st from '../../../global/styles'
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

const FilteredList = ({ navigation, route }) => {
  const [title, setTitle] = useState()
  const { filterType } = route.params;
  const activityPlanList = useAppSelector(state => state.activityPlan.data);

  const filteredList = useMemo(() => {
    return activityPlanList.filter(item => {
      const status = getPlanStatus(item); 
  
      const activityDate = parseDDMMYYYY(item.visit_Start_Date);
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const onlyDate = new Date(activityDate);
      onlyDate.setHours(0, 0, 0, 0);
  
      if (filterType === "COMPLETED") {
        return status === "Completed";
      }
  
      if (filterType === "TODAY") {
        return (
          status === "Pending" ||
          (status === "In Progress" && onlyDate.getTime() === today.getTime())
        );
      }
  
      if (filterType === "OVERDUE") {
        return (
          status === "Overdue" ||
          (status === "In Progress" && onlyDate.getTime() < today.getTime())
        );
      }
  
      if (filterType === "SCHEDULED") {
        return (
          status === "Scheduled" ||
          (status === "In Progress" && onlyDate.getTime() > today.getTime())
        );
      }
  
      return true;
    });
  }, [activityPlanList, filterType]);
  
 
  useEffect(() => {
    if (filterType === "COMPLETED") setTitle("Completed Activities");
    if (filterType === "TODAY") setTitle("Today's Activities");
    if (filterType === "OVERDUE") setTitle("Overdue Activities");
    if (filterType === "SCHEDULED") setTitle("On-Schedule Activities");
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        navigation.navigate('MainApp')
        return true; 
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  const uniqueList = useMemo(() => {
    const map = new Map();

    (filteredList || []).forEach(item => {
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
  }, [filteredList]);

  return (
    <CustomContainer>
      <CustomHeader title={title} onBackPress={() => navigation.navigate('MainApp')} />
      <FlatList
        data={uniqueList}
        keyExtractor={(item) => item.atP_Id.toString()}
        renderItem={({ item }) => <AcitivityComponent
          item={item}
          onPress={() =>
            navigation.navigate('ATPLogin',
              { atP_Id: item.atP_Id, animation: 'none', filterType: filterType }
            )
          }
        />
        }
        ListHeaderComponent={() =>
          <Text style={st.tx14}>
            {uniqueList?.length > 0 && `Total ${uniqueList?.length} activities`}
          </Text>
        }
        ListEmptyComponent={() => <EmptyItem />}
        contentContainerStyle={st.pd20}
      />
    </CustomContainer>
  )
}

export default FilteredList

const styles = StyleSheet.create({})