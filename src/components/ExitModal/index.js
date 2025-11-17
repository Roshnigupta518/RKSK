import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import st from '../../global/styles';
import { colors } from '../../global';

const ConfirmModal = ({
  visible,
  title = "Are you sure?",
  message = "",
  confirmText = "Yes",
  cancelText = "Cancel",
  onCancel,
  onConfirm
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>

          <Icon name="alert-triangle" size={45} color="#FF3B30" style={{ marginBottom: 10 }} />

          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Text style={st.tx14}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitBtn}
              onPress={onConfirm}
            >
              <Text style={[st.tx14, { color: colors.white }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    ...st.tx20,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    ...st.tx14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  exitBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
});
