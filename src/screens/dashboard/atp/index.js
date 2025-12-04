import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import st from '../../../global/styles';
import EmptyItem from '../../../components/emptyItem';
import { useAppSelector } from '../../../hooks';
import AcitivityComponent from '../../../components/AcitivityComponent';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../../global';
import ReusableBottomSheet from '../../../components/filterSheet';
import CustomDatePicker from '../../../components/CustomDatePicker';
import MyInput from '../../../components/customInput'
import CustomPicker from '../../../components/customPicker';
import { convertToISODate, getPlanStatus } from '../../../utils/helper';

const INITIALINPUT = {
  date: '',
  activityName: '',
  status:''
};

const ATPListScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [inputs, setInputs] = useState(INITIALINPUT);
  const [errors, setErrors] = useState(INITIALINPUT);
  const [filteredList, setFilteredList] = useState([]);
  const [isFilterPressed, setIsFilterPressed] = useState(false);

  const sheetRef = useRef();
  const activityPlanList = useAppSelector(state => state.activityPlan.data);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Icon
          name="sliders"
          size={22}
          color={colors.white}
          style={{ marginRight: 15 }}
          onPress={() => sheetRef.current.open()}
        />
      )
    });
  }, []);

  const handleOnchange = useCallback(
    (field) => (value) => {
      setInputs((prev) => {
        let updated = { ...prev, [field]: value };
        return updated;
      });
    },
    []
  );

  const handleError = useCallback((errorMsg, field) => {
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  }, []);

  const fieldProps = (field) => ({
    value: inputs[field],
    error: errors[field],
    onChangeText: (value) => {
      handleOnchange(field)(value);
      if (errors[field]) handleError('', field);
    },
    onFocus: () => {
      if (errors[field]) handleError('', field);
    },
    disabled: isLoading,
  });

  const pickerFieldProps = (field) => ({
    selectedValue: inputs[field],
    error: errors[field],
    onValueChange: (val) => {
        handleOnchange(field)(val);
        handleError(field);
    },
    disabled: isLoading,
});

  const dateFieldProps = (field, mode = 'date') => ({
    value: inputs[field] ? new Date(inputs[field]) : new Date(),
    error: errors[field],
    mode,
    onChange: (val) => {
      // ✅ store as ISO string to preserve the actual time
      handleOnchange(field)(val.toISOString());
      if (errors[field]) handleError('', field);
    },
    disabled: isLoading,
  });

  const applyFilters = () => {
    let filtered = [...uniqueList];
  
    // 1️⃣ DATE FILTER
    if (inputs.date) {
      const selectedDate = new Date(inputs.date).toISOString().split("T")[0];
    
      filtered = filtered.filter(item => {
        const formattedItemDate = convertToISODate(item?.visit_Start_Date);
    
        return formattedItemDate === selectedDate;
      });
    }
    
  
    // 2️⃣ ACTIVITY NAME FILTER
    if (inputs.activityName.trim() !== "") {
      filtered = filtered.filter(item =>
        item.visit_Purpose?.toLowerCase().includes(inputs.activityName.toLowerCase())
      );
    }
  
    // 3️⃣ STATUS FILTER
    if (inputs.status) {
      filtered = filtered.filter(item => {
        const status = getPlanStatus(item);
        return statusData.find(s => s.value === inputs.status)?.label === status;
      });
    }
  
    return filtered;
  };

  const clearFilters = () => {
    setInputs(INITIALINPUT);
    setFilteredList([]);
    setIsFilterPressed(false);   // 🔥 filter removed
    sheetRef.current.close();
  };  
  
  const onFilterApplyPress = () => {
    const result = applyFilters();
    setFilteredList(result);
    setIsFilterPressed(true);   // 🔥 user actually applied filter
    sheetRef.current.close();
  };   

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
      <AcitivityComponent 
        item={item}
        onPress={() => 
          navigation.navigate('ATPLogin', 
            { atP_Id: item.atP_Id, animation: 'none' }
          )
        }
      />
    )
  };

  return (
    <View style={st.container}>
      <FlatList
        data={isFilterPressed ? filteredList : uniqueList}
        keyExtractor={item => item.atP_Id}
        renderItem={renderItem}
        contentContainerStyle={st.pd20}
        ListEmptyComponent={() => {
          if (isLoading) return <EmptyItem isLoading={true} />;
        
          if (isFilterPressed && filteredList.length === 0) {
            return <EmptyItem message="No data found with selected filters" />;
          }
        
          return <EmptyItem message="No activities available" />;
        }}
        removeClippedSubviews={false}
      />

      <ReusableBottomSheet
        ref={sheetRef}
        title="Filter your search"
        buttonText="Filter"
        height={450}
        onButtonPress={onFilterApplyPress}
        footerExtraButton={{
          label: "Clear Filter",
          onPress: clearFilters,
        }}
        >

        <CustomDatePicker
          label="Date"
          placeholder=""
          iconName={'calendar'}
          {...dateFieldProps('date', 'date')}
        />
        <MyInput label="Activity Name"
          {...fieldProps('activityName')}
        />
        <CustomPicker 
          items={statusData}
          label={'Status'}
          placeholder=''
          {...pickerFieldProps('status')}
          />
      </ReusableBottomSheet>

    </View>
  );
};

export default ATPListScreen;

const statusData = [
  {label:'Completed', value:'Completed'},
  {label:'In Progress', value:'In Progress'},
  {label:'Pending', value:'Pending'},
  {label:'Scheduled', value:'Scheduled'},
  {label:'Overdue', value:'Overdue'}
]
