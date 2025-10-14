import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import st from '../../global/styles';

const Field = ({ label, value, txColor }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value,{color:txColor}]}>{value || '-'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    flex: 1,
   ...st.tx12,
  },
  value: {
    flex: 1,
    ...st.tx12,
    ...st.txbold,
    ...st.txAlignR
  },
});

export default Field;
