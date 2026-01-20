import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToLocal = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

export const getFromLocal = async key => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};
