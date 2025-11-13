import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState(true); // Assuming network is initially connected

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        // Clean up subscription when component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array to run effect only once when component mounts

    return isConnected;
};

export default useNetworkStatus;
