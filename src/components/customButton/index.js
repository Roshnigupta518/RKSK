import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator, Keyboard
} from 'react-native';
import React from 'react';
import st from '../../global/styles';
import { colors } from '../../global';
const Button = ({
  title,
  backgroundColor,
  onPress = () => {},
  disabled,
  isLoading,
  titleColor,
}) => {
  const finalBgColor = disabled
    ? colors.grey
    : backgroundColor || colors.orange;

  return (
    <TouchableOpacity
      onPress={()=>{
        onPress()
        Keyboard.dismiss()
      }}
      activeOpacity={0.7}
      disabled={disabled}
      style={[
        {
          borderRadius: 8,
          marginTop: 15,
          height: 50,
          borderWidth: 0.5,
          borderColor: colors.lightGrey,
          // elevation: Platform.OS == 'android' ? 1 : null,
          shadowColor: colors.black,
          shadowOpacity: 0.3,
          shadowOffset: {width: 0, height: 0.5},
          shadowRadius: 8,
          backgroundColor: finalBgColor,
          alignItems: 'center',
          justifyContent:'center',
          paddingVertical: 5,
          paddingHorizontal:15
        },
      ]}>
      <View style={st.row}>
        {(isLoading) && <ActivityIndicator color={colors.lightOrange} style={{marginRight:10}} />}
        {/* {(isLoading && !disabled) && <ActivityIndicator color={titleColor || "#fff"} style={{marginRight:10}} />} */}

        <Text numberOfLines={1} adjustsFontSizeToFit
          style={[
            st.tx14, st.txbold,
            st.txAlignC,
            {color: titleColor || colors.white},
          ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({});
