import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../global';

const Alert = ({showModal, setShowModal, children}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showModal}
      style={[styles.center]}
      onBackdropPress={() => setShowModal(!showModal)}
      onRequestClose={() => {
        setShowModal(!showModal);
      }}>
      <View style={[styles.center]}>
        <View style={styles.modalView}>
          <TouchableOpacity
            onPress={() => {
              setShowModal(false);
            }}
            style={styles.closeIconCont}>
            <Icon
              name="closecircle"
              color={colors.skyblue}
              size={25}
              style={styles.closeIcon}
            />
          </TouchableOpacity>

          {children}
        </View>
      </View>
    </Modal>
  );
};

export default Alert;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView:{
    backgroundColor: '#fff' ,
    width: '80%',
    borderRadius: 7,
    // marginTop: Dimensions.get('window').height * 0.3,
    borderColor: '#d9d9d9',
    borderWidth:0.7,
    shadowColor:'#ccc',
    shadowOpacity:1,
    shadowOffset:{width:0,height:3},
    shadowRadius:5
  },
  closeIconCont: {
   alignItems:'flex-end'
  },
  closeIcon: {
    marginTop: 20,
    marginRight: 20,
  },

  btn: {
    marginTop: 20,
    width: '70%',
  },
});