import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import st from '../../global/styles';
import { colors } from '../../global';

const CustomHeader = ({ title, onBackPress, rightIcon, onRightPress, primaryScreening, onPrimaryPress }) => {
  return (

    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBackPress} disabled={!onBackPress} style={st.wdh10}>
        {onBackPress ? (
          <Icon name="chevron-left" size={28} color={colors.white} />
        ) : (
          <View /> // placeholder
        )}
      </TouchableOpacity>

      {/* Title */}
      <View style={[st.wdh80, st.align_C]}>
        <Text style={[st.tx16, { color: colors.white }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      </View>

      {/* Right Icon/Action */}
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} disabled={!rightIcon} style={st.wdh10}>
          <View style={[st.row, { backgroundColor: colors.white, paddingVertical: 5, borderRadius: 5, width: 30, height: 30, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="plus" size={20} color={colors.black} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>

  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    height: 90,
    paddingHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: colors.blue,
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
