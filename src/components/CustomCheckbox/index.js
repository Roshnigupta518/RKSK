import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; 
import st from '../../global/styles';
import { colors } from '../../global';

export default CustomCheckbox = ({ label, checked, onChange }) => {
  return (
    <Pressable style={styles.container} onPress={() => onChange(!checked)}>
      <View style={[styles.checkboxBase, checked && styles.checkboxChecked]}>
        {checked && <Icon name="check" size={14} color="#fff" />}
      </View>
      {label && <Text style={st.tx12}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBase: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight:4,
    backgroundColor: colors.white

  },
  checkboxChecked: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
});
