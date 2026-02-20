import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const prevStatus = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentStatus = !!state.isConnected;

      // 🔥 Only update if actually changed
      if (prevStatus.current !== currentStatus) {
        prevStatus.current = currentStatus;
        setIsConnected(currentStatus);
      }
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

export default useNetworkStatus;

