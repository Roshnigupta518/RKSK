import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import st from '../../global/styles';
import { size,family, colors } from '../../global';

const MyInput = ({
  label,
  iconName,
  error,
  inputsty,
  password = false,
  labelColor,
  disabled = false,
  inputTxt,
  onFocus,
  ...props
}) => {
  const [hidePassword, setHidePassword] = useState(password);

  return (
    <View style={st.mt_B}>
      {label && (
        <Text
          style={[
            st.tx12,
            { color: labelColor ? labelColor : colors.black },
          ]}>
          {label}
        </Text>
      )}

      <View
        style={[
          style.inputContainer,
          inputsty,
          error && style.errorBorder,
          {
            paddingLeft: iconName ? 40 : 10,
            backgroundColor: disabled ? colors.disabled : colors.white,
          },
        ]}>
        {iconName && (
          <Icon
            name={iconName}
            style={style.leftIcon}
            size={22}
            color={colors.black}
          />
        )}

        <TextInput
          autoCorrect={false}
          onFocus={onFocus}
          secureTextEntry={password ? hidePassword : false} // ✅ only if password
          style={[
            style.inputtxt,
            inputTxt,
            { color: disabled ? colors.grey : colors.black },
          ]}
          placeholderTextColor={'#777'}
          editable={!disabled}
          {...props}
        />

        {password && (
          <Icon
            onPress={() => setHidePassword(!hidePassword)}
            name={hidePassword ? 'eye' : 'eye-off'}
            style={style.eyeIcon}
            size={22}
            color={colors.grey}
          />
        )}
      </View>

      {error && <Text style={st.error}>{error}</Text>}
    </View>
  );
};

const style = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    paddingRight: 15,
    borderRadius: 5,
    // alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 1)',
    height: 48,
  },
  inputtxt: {
    fontSize: size.subtitle,
    fontFamily: family.regular,
    flex: 1,
  },
  errorBorder: {
    borderColor: 'red',
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  eyeIcon: {
    padding: 5,
  },
});

export default React.memo(MyInput);
