import React, { forwardRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import CustomButton from "../customButton";
import st from "../../global/styles";
import Icon from 'react-native-vector-icons/Feather';
import { colors } from "../../global";

const ReusableBottomSheet = forwardRef(
  ({ title, height = 350, children, buttonText = "Apply", footerExtraButton, onButtonPress, onClose }, ref) => {
    return (
      <RBSheet
        ref={ref}
        height={height}
        openDuration={250}
        customStyles={{
          container: {
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }
        }}
      >
        <View style={styles.container}>

          {/* top drag line */}
          <View style={styles.dragLine} />
          <TouchableOpacity onPress={onClose} style={{position:'absolute', top:0, right:0}} >
          <Icon name='x' size={20} color={colors.blue} />
          </TouchableOpacity>
          <ScrollView>

          {/* Title */}
          {title && <Text style={st.tx16}>{title}</Text>}

          {/* Dynamic Content (from parent) */}
          <View style={{ marginTop: 10 }}>
            {children}
          </View>

          {/* bottom action button */}
          <View style={[st.row]}>
            <View style={st.wdh48}>
            {onButtonPress && (
              <CustomButton
                title={buttonText}
                onPress={onButtonPress}
              />
            )}
            </View>
           

            {/* EXTRA BUTTON — OPTIONAL */}
            <View style={[st.wdh48,{marginLeft:'4%'}]}>
            {footerExtraButton && (
              <CustomButton
                title={footerExtraButton.label}
                onPress={footerExtraButton.onPress}
              />
            )}
            </View>
          </View>
          </ScrollView>
        </View>
      </RBSheet>
    );
  }
);

export default ReusableBottomSheet;

const styles = StyleSheet.create({
  container: { flex: 1 },

  dragLine: {
    width: 60,
    height: 5,
    backgroundColor: "#d9d9d9",
    alignSelf: "center",
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 5,
  },
});
