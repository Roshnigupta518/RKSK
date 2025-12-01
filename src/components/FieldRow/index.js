// FieldRow.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const FieldRow = ({ children }) => {
  return <View style={styles.row}>{children}</View>;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});

export default FieldRow;
