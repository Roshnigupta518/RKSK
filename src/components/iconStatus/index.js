import React from 'react';
import { View } from 'react-native';
import styles from '../../global/styles';
import { showIconColor, showIconName } from '../../utils/helper';
import Icon from 'react-native-vector-icons/Feather';

const IconStatus = ({ status }) => {
    return (
        <View style={styles.statusIconSty}>
            <Icon name={showIconName(status)} size={12} color={showIconColor(status)} />
        </View>
    );
};


export default IconStatus;