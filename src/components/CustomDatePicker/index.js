import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Feather';
import st from '../../global/styles';
import { colors } from '../../global';

const CustomDatePicker = ({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
  error = '',
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (selectedDate < new Date(1900, 0, 1)) {
        onChange(new Date(1900, 0, 1)); // ✅ force minimum
      } else {
        onChange(selectedDate);
      }
    }
  };

  return (
    <View style={{ marginBottom: 15}}>
      {label && <Text style={st.tx12}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.inputBox,
          error && styles.inputError,
          disabled && styles.disabledBox,
        ]}
        onPress={() => {
          if (!disabled) setShowPicker(true);
        }}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text
          style={[
            value ? styles.valueText : styles.placeholder,
            disabled && styles.disabledText,
          ]}
        >
          {value ? moment(value).format('DD-MM-YYYY') : placeholder}
        </Text>
        <Icon name="calendar" size={20} color={colors.black} />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showPicker && (
        <DateTimePicker
          value={value || new Date(1900, 0, 1)} // ✅ default 1900-01-01
          mode={mode}
          onChange={onDateChange}
          minimumDate={new Date(1900, 0, 1)} // ✅ strictly 1 Jan 1900 se aage
          maximumDate={maximumDate}
        // display={Platform.OS === 'android' ? 'spinner' : 'default'}
        />
      )}


    </View>
  );
};

const styles = StyleSheet.create({
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: colors.white,
  },
  valueText: {
    color: '#000',
    ...st.tx12,
  },
  placeholder: {
    color: '#999',
    ...st.tx12,
  },
  inputError: {
    borderColor: 'red',
  },
  error: {
    color: 'red',
    marginTop: 4,
    ...st.label,
  },
  disabledBox: {
    backgroundColor: colors.disabled,
    borderColor: '#ddd',
  },
  disabledText: {
    color: colors.grey,
  },
});

export default CustomDatePicker;
