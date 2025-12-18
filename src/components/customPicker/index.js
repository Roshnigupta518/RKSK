import React from 'react';
import { View, Text, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import st from '../../global/styles';
import { colors } from '../../global';

const CustomPicker = ({
  label,
  selectedValue,
  onValueChange,
  items = [],
  placeholder = 'Select an option',
  style = {},
  fontFamily = 'System',
  showIcon = true,
  error = '',
  disabled
}) => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      {label && <Text style={[styles.label, { fontFamily }]}>{label}</Text>}
     
      <View  style={[
          styles.pickerWrapper,
          style,
          disabled ? styles.disabledWrapper : null, // 🆕
          error ? styles.errorBorder : null,
        ]}>
      
        <Picker enabled={!disabled}
          selectedValue={selectedValue}
          // onValueChange={onValueChange}
          onValueChange={(value, index) => {
            Keyboard.dismiss(); // ← this ensures keyboard hides
            onValueChange(value, index);
          }}
          style={[
            styles.picker,
            { fontFamily },
            disabled ? styles.disabledText : null, // 🆕
          ]}
          dropdownIconColor="transparent" // Hide native icon on Android
        >
          <Picker.Item label={'Select'} value="" color={colors.grey} />
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
    </TouchableWithoutFeedback>

  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    ...st.tx12
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor:colors.white
  },
  picker: {
    height: 55,
    width: '100%',
    paddingHorizontal: 12,
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: Platform.OS === 'ios' ? 20 : 15,
    zIndex: 1,
  },
  error: {
    ...st.tx12,
    color: 'red',
    marginTop: 4,
  },
  disabledWrapper: {
    backgroundColor: colors.disabled,
    borderColor: '#ddd',
  },
  disabledText: {
    color: '#aaa',
  },
  errorBorder: {
    borderColor: 'red',
  },
});

export default CustomPicker;
