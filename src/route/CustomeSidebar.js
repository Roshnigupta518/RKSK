import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';

const CustomeSidebar = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  )
}

export default CustomeSidebar

const styles = StyleSheet.create({})