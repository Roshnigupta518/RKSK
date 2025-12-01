// Field.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import st from '../../global/styles';

const Field = ({ label, value, txColor, alignRight }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, alignRight && { textAlign: 'right' }, ]} numberOfLines={1} alignRight>{label}</Text>

      <Text
        style={[
          styles.value,
          alignRight && { textAlign: 'right' }, //this aligns fully right
          { color: txColor },
        ]}
      >
        {value || '-'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%', // 2 columns
    marginBottom: 10,
  },
  label: {
    ...st.tx12,
    color: '#6C6C6C',
  },
  value: {
    ...st.tx12,
    ...st.txbold,
    marginTop: 3,
  },
});

export default Field;
