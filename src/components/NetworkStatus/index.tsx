import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const NetworkStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No Internet Connection</Text>
      </View>
    );
  }

  return null;
};

export default NetworkStatus;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    // color: 'white',
    fontWeight: 'bold',
  },
});
