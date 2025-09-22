// import {View, Text, TextInput, StyleSheet, Image} from 'react-native';
// import React from 'react';
// import st from '../../global/styles';
// import {colors, images} from '../../global/theme';
// import Icon from 'react-native-vector-icons/Feather';
// import {size, family} from '../../global/fonts';

// const MyInput = ({
//   label,
//   iconName,
//   error,
//   inputsty,
//   password,
//   labelColor,
//   textSty,
//   disabled,
//   txbold,
//   inputTxt,
//   onFocus = () => {},
//   ...props
// }) => {
//   const [hidePassword, setHidePassword] = React.useState(password);
//   const [isFocused, setIsFocused] = React.useState(false);

//   return (
//     <View style={st.mt_B}>
//       {label && (
//         <Text
//           style={[st.tx12, {color: labelColor ? labelColor : colors.black}]}>
//           {label}
//         </Text>
//       )}
//       <View
//         style={[
//           style.inputContainer,
//           inputsty,
//           error ? style.errorBorder : null,
//           {
//             paddingLeft: iconName ? 40 : 5,
//             backgroundColor: disabled ? colors.disabled : colors.white,
//           },
//         ]}>
//         {iconName && (
//           <Icon
//             name={iconName}
//             style={{
//               position: 'absolute',
//               top: 10,
//               left: 15,
//               width: 25,
//               height: 25,
//               color: colors.black,
//             }}
//             color={colors.black}
//             size={22}
//           />
//         )}
//         <TextInput
//           autoCorrect={false}
//           onFocus={() => {
//             onFocus();
//             setIsFocused(true);
//           }}
//           onBlur={() => setIsFocused(false)}
//           // secureTextEntry={hidePassword}
//           secureTextEntry={password ? hidePassword : false}

//           style={[style.inputtxt, inputTxt,
//              {color: disabled ? colors.grey : null,}
//             ]}
//           {...props}
//           placeholderTextColor={'#777'}
//           editable={!disabled}
//         />

//         {password && (
//           <Icon
//             onPress={() => setHidePassword(!hidePassword)}
//             name={hidePassword ? 'eye' : 'eye-off'}
//             style={{fontSize: 22}}
//           />
//         )}
//       </View>
//       {error && (
//         <Text style={st.error}>{error}</Text>
//       )}
//     </View>
//   );
// };

// const style = StyleSheet.create({
//   label: {
//     marginVertical: 5,
//     fontSize: 14,
//     color: colors.grey,
//   },

//   inputContainer: {
//     // backgroundColor: colors.white,
//     flexDirection: 'row',
//     paddingLeft: 40,
//     paddingRight: 15,
//     borderRadius: 7,
//     alignItems: 'center',
//     marginTop: 10,
//     borderWidth: 1,
//     borderColor: 'rgba(200, 200, 200, 1)',
//     height: 48,
//   },
//   inputtxt: {
//     fontSize: size.subtitle,
//     color: colors.black,
//     fontFamily: family.regular,
//     flex: 1,
//   },
//   errorBorder: {
//     borderColor: 'red',
//   },
// });

// // export default MyInput;
// export default React.memo(MyInput);

import { View, Text, TextInput, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { colors } from '../../global/theme';
import Icon from 'react-native-vector-icons/Feather';
import { size, family } from '../../global/fonts';
import st from '../../global/styles';

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
    borderRadius: 7,
    // alignItems: 'center',
    marginTop: 10,
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
