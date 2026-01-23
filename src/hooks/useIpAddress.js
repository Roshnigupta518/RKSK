import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';

const useIpAddress = () => {
  const [ipAddress, setIpAddress] = useState('');

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const ip = await DeviceInfo.getIpAddress();
        setIpAddress(ip);
      } catch (error) {
        console.log('Error fetching IP:', error);
      }
    };

    fetchIp();
  }, []);

  return ipAddress;
};

export default useIpAddress;
