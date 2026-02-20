import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../global';
import st from '../../global/styles';

const CustomPopup = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Okay',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {title ? <Text style={[st.tx16, st.txAlignC]}>{title}</Text> : null}
          <Text style={[st.tx14, st.mt_10, st.txAlignC]}>{message}</Text>
          <View style={[styles.buttonContainer,{justifyContent:showCancel ? 'space-around' : 'center' }]}>
            {showCancel && (
              <TouchableOpacity style={[styles.button,{backgroundColor:colors.white}]} onPress={onClose}>
                <Text style={st.tx14}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button]} onPress={onConfirm}>
              <Text style={[st.tx14,{color:colors.white}]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:20
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
    borderWidth:1,
    borderColor:colors.blue,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:5,
    backgroundColor:colors.blue
  },
  cancelText: {
    color: 'gray',
    fontWeight: '600',
  },
  confirmText: {
    color: '#007BFF',
    fontWeight: '600',
  },
});

export default CustomPopup;
