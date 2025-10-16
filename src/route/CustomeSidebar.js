import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import {clearLogin} from '../redux/slices/login'
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather'
import { size, family } from '../global';
const CustomeSidebar = (props) => {

  const dispatch = useDispatch();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
          label={({focused, color}) => (
            <Text style={{
              fontSize: size.subtitle,
          textTransform: 'capitalize', 
          fontFamily: family.medium, 
            }}>{'Logout'}</Text>
          )}
          icon={({focused, color}) => (
            <Icon name={'log-out'} size={19} />
          )}
          onPress={() => dispatch(clearLogin())}></DrawerItem>
    </DrawerContentScrollView>
  )
}

export default CustomeSidebar

const styles = StyleSheet.create({})