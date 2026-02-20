import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import React from 'react';
import st from '../../global/styles';
import { colors } from '../../global';

const Button = React.memo(({
  title,
  backgroundColor,
  onPress = () => {},
  disabled = false,
  titleColor,
  loading = false,
}) => {
  const finalBgColor = disabled
    ? colors.black
    : backgroundColor || colors.blue;

  return (
    <TouchableOpacity
      onPress={() => {
        Keyboard.dismiss();
        if (!loading) onPress(); // Prevent multiple presses while loading
      }}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        {
          borderRadius: 5,
          marginTop: 15,
          height: 50,
          borderWidth: 0.5,
          borderColor: colors.lightGrey,
          // shadowColor: colors.black,
          // shadowOpacity: 0.3,
          // shadowOffset: { width: 0, height: 0.5 },
          // shadowRadius: 8,
          backgroundColor: finalBgColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 5,
          paddingHorizontal: 15,
        },
      ]}>
      <View style={st.row}>
        {loading && (
          <ActivityIndicator color={colors.white} style={{ marginRight: 10 }} />
        )}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            st.tx14,
            st.txbold,
            st.txAlignC,
            { color: titleColor || colors.white },
          ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
 );
});
export default React.memo(Button);

