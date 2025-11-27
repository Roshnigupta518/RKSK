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
      <View style={[st.wdh70, st.align_C]}>
      <Text style={[st.tx16,{color:colors.white}]}numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      </View>

      {/* Right Icon/Action */}
      {rightIcon ? (
      <TouchableOpacity onPress={onRightPress} disabled={!rightIcon} style={st.wdh20}>
          <View style={[st.row,{backgroundColor:colors.orange,paddingVertical:5,borderRadius:5,paddingHorizontal:10, justifyContent:'center', alignItems:'center'}]}>
          <Icon name={rightIcon} size={20} color={colors.white} />
          <Text style={[st.tx14,{color:colors.white}]}>{' Add'}</Text>
          </View>
      </TouchableOpacity>
       ) : (
        <View style={{ width: 24 }} /> 
      )}

      {primaryScreening&&
       <TouchableOpacity onPress={onPrimaryPress} disabled={!primaryScreening} >
       <Icon name="chevron-right" size={28} color={colors.black} />
       </TouchableOpacity>
      }
    </View>
    
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    height: 90,
    paddingHorizontal: 16,
    flexDirection: 'row',
    backgroundColor:colors.blue,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop:20,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
