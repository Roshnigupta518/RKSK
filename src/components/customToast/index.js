import React from "react";
import { View, Text } from "react-native";
import { colors } from "../../global";
import st from "../../global/styles";
const MyToast = ({ text1, text2, props }) => {
  return (
    <View
      style={{
        backgroundColor: props.key === 'error' ? colors.red : props.key === 'success' ? colors.blue :  props.bgColor || "#333",
        padding: 12,
        borderRadius: 10,
        // margin: 12,
      }}
    >
      <Text style={[st.tx14,st.txbold,{color:colors.white}]}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={[st.tx12,{color:colors.white}]}>
          {text2}
        </Text>
      ) : null}
    </View>
  );
};

export default MyToast;
