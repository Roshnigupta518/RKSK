import {StyleSheet, Text, View, ScrollView} from 'react-native';
import React from 'react';
import { colors } from '../../global';
import st from '../../global/styles';

const CustomContainer = ({children, style}) => {
  return <View style={[st.container, style]}>{children}</View>;
};

const CustomContent = ({children, style}) => {
  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps={'handled'}>
      <View style={[styles.content, style]}>{children}</View>
    </ScrollView>
  );
};

export {CustomContainer, CustomContent};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    padding: 20,
  },
});
