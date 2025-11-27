import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import st from '../../global/styles';
import { colors } from '../../global';
export default function LocationBanner({ message, buttonText, onPress }) {
  return (
    <View
      style={{
        backgroundColor: '#FFE9E9',
        padding: 15,
        borderWidth: 1,
        borderColor: '#FFB3B3',
        borderRadius: 10,
        alignItems:'center'
      }}
    >
      <Text style={st.tx16}>
        {message}
      </Text>

      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: '#D40000',
          paddingVertical: 5,
          paddingHorizontal: 15,
          borderRadius: 6,
        }}
      >
        <Text style={[st.tx12,{color:colors.white}]}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}
