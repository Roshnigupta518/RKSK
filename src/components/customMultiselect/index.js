import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSelect from 'react-native-multiple-select';
import { colors } from '../../global';
import st from '../../global/styles';

const CustomMultiSelect = ({
  label,
  items = [],
  selectedItems = [],
  onSelectedItemsChange,
  uniqueKey = 'id',
  placeholder = 'Select items',
  single = false,
  required = false,
  error,
  disable
}) => {
  const hasError = typeof error === 'string' && error.length > 0;
  return (
    <View style={styles.container}>
      
      {label && <Text style={[styles.label]}>{label}</Text>}

      <MultiSelect
        // hideTags
        items={items}
        uniqueKey={uniqueKey}
        onSelectedItemsChange={onSelectedItemsChange}
        selectedItems={selectedItems}
        selectText={placeholder}
        searchInputPlaceholderText="Search..."
        tagRemoveIconColor={colors?.blue || 'red'}
        tagBorderColor={colors?.blue || '#007bff'}
        tagTextColor={colors?.blue || '#007bff'}
        selectedItemTextColor={colors?.blue || '#007bff'}
        selectedItemIconColor={colors?.blue || '#007bff'}
        itemTextColor="#000"
        displayKey="name"
        searchInputStyle={{ color: '#000' }}
        submitButtonColor={colors?.primary || '#007bff'}
        submitButtonText="OK"
        single={single}
        styleDropdownMenuSubsection={[styles.dropdown, {borderColor:hasError?colors.red : '#ccc'}]}
        disabled={disable}
        iconColor={colors?.black || '#007bff'} 
        scrollEnabled={false}
        tagContainerStyle={{marginBottom:10, width:'95%'}}
      />

      {error ? <Text style={st.error}>{error}</Text> : null}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom: 10,
  },
  label: {
    marginBottom: 8,
    ...st.tx12
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingLeft:15,
    height:50
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

// export default CustomMultiSelect;
export default React.memo(CustomMultiSelect);
