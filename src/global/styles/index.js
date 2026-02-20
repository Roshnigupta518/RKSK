import { StyleSheet } from "react-native";
import {colors, family, size} from "../index";

export default StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:colors.lightGrey
    },
    flex: {
      flex: 1,
    },
    pd20:{
      padding:20
    },
    pd_H20:{
  paddingHorizontal:20
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
    mb_10:{
     marginBottom:'10%'
    },

    mt_5 : {
      marginTop:'5%'
    },

    wdh60: {width: '60%'},
    wdh40: {width: '40%'},
    wdh20: {width: '20%'},
    wdh25: {width: '25%'},
    wdh30: {width: '30%'},
    wdh10: {width: '10%'},
    wdh15: {width: '15%'},
    wdh18: {width: '18%'},
    wdh55: {width: '55%'},
    wdh70: {width: '70%'},
    wdh50: {width: '50%'},
    wdh48: {width: '48%'},
    wdh75: {width: '75%'},
    wdh80: {width: '80%'},
    wdh90: {width: '90%'},
    wdh65: {width: '65%'},
    wdh85: {width: '85%'},
  
    tx12: {
      fontSize: size.label,
      color: colors.black,
      fontFamily: family.regular,
    },
    tx10: {
      fontSize: 10,
      color: colors.white,
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
      fontFamily: family.semiBold,
    },
  
    tx20: {
      fontSize: size.heading,
      color: colors.black,
      fontFamily: family.semiBold,
    },
    tx22: {
      fontSize: size.extraHead,
      color: colors.secondary,
      fontFamily: family.semiBold,
    },

    bordersty:{
      height:1,
      backgroundColor:colors.disabled,
      marginVertical:15
    },

    inputContainer:{
      flexDirection: 'row',
      paddingHorizontal: 15,
      borderRadius: 5,
      alignItems: 'center',
      marginVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(200, 200, 200, 1)',
      height: 48,
      backgroundColor: colors.white
    },
    photoContainer:{
      borderRadius: 5,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(200, 200, 200, 1)',
      height: 103,
      backgroundColor: colors.white,
      width:'100%',
    },
    iconLeft:{position:'absolute', right:15},
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 2,
    },
    imageSty:{
      width:100,
      height:100, 
      borderRadius:5,
      borderWidth:0.5,
      borderColor:colors.lightGrey,
      borderRadius:5,
    },
    plusbox:{
      width:100,
      height:100, 
      borderRadius:5,
      borderWidth:0.8,
      borderColor:colors.lightGrey,
      borderRadius:5,
      justifyContent:'center',
      alignItems:'center'
    },
    warningBox:{
      padding:10, 
      flexDirection:'row',
      backgroundColor:'#FFF8E5',
      marginVertical:10,
      alignItems:'center'
    },
    statusIconSty:{
      position:'absolute',
      top:2,
      right:5,
    },
})