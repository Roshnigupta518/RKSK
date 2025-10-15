import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import st from '../../global/styles';
import { colors } from '../../global';
const HomeHeader = ({title, onBackPress, rightIcon, onRightPress}) => {
  return (
    <View style={[st.flex, st.justify_C]}>
    <View style={[st.row, st.justify_S, st.pd_H20]}>
      <TouchableOpacity onPress={onBackPress}>
        <Icon name={'menu'} size={24} color={colors.black} />
      </TouchableOpacity>
      <View>
        <Text style={[st.tx18]}>{title}</Text>
      </View>
      <TouchableOpacity 
      // onPress={() => onNotification()}
      >
        <Icon name={'user'} size={24} color={colors.black} />
      </TouchableOpacity>
    </View>
  </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    height: 80,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
