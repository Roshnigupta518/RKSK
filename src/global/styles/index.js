import { StyleSheet } from "react-native";
import {colors, family, size} from "../index";

export default StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:colors.white
    },
    flex: {
      flex: 1,
    },
    row: {flexDirection: 'row'},
    center: {justifyContent: 'center', alignItems: 'center', flex: 1},
    align_C: {alignItems: 'center'},
    align_E: {alignItems: 'flex-end'},
    justify_C: {justifyContent: 'center'},
    justify: {justifyContent: 'flex-end'},
    justify_S: {justifyContent: 'space-between'},
    justify_A: {justifyContent: 'space-around'},
  
    txAlignC: {textAlign: 'center'},
    txAlignJ: {textAlign: 'justify'},
    txAlignR: {textAlign: 'right'},
    txAlignL: {textAlign: 'left'},
  
    txCap: {textTransform: 'capitalize'},
    txUpr: {textTransform: 'uppercase'},
  
    txDecor: {textDecorationLine: 'underline'},
  
    txbold: {fontFamily: family.semiBold},

    mt_10 : {
      marginTop:'10%'
    },
  
    tx12: {
      fontSize: size.label,
      color: colors.black,
      fontFamily: family.regular,
    },
    error:{
      fontSize: size.label,
      color: colors.red,
      fontFamily: family.regular,
    },
  
    tx14: {
      fontSize: size.subtitle,
      color: colors.black,
      fontFamily: family.regular,
    },
    tx18: {
      fontSize: size.subheading,
      color: colors.black,
      fontFamily: family.semiBold,
    },
    tx16: {
      fontSize: size.title,
      color: colors.black,
      fontFamily: family.bold,
    },
  
    tx20: {
      fontSize: size.heading,
      color: colors.black,
      fontFamily: family.semiBold,
    },
    tx22: {
      fontSize: size.extraHead,
      color: colors.secondary,
      fontFamily: family.bold,
    },
})