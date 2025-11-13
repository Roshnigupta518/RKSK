import { StyleSheet, Text, View } from 'react-native'
import React,{useEffect} from 'react'
import { reStartBackgroundService } from '../../../utils/bgservices/backgroundService'
import { syncTaskName } from '../../../utils/bgservices/backgroundTaskEnum'
import useNetworkStatus from '../../../hooks/networkStatus'

const Home = () => {
  const isConnected = useNetworkStatus();

  const startSync = () => {
    if (isConnected) {
      reStartBackgroundService(syncTaskName.all);
    } 
  };

   useEffect(() => {
    startSync();
  }, [isConnected]);

  return (
    <View>
      <Text>Home</Text>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})