import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../redux/store';
import { clearLogin } from '../../redux/slices/login';

export const getApi = async (api) => {
  const state = store.getState();
  const token = state?.login?.data?.jwtToken;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  console.log('📡 API Request:', api);
  try {
    const response = await axios.get(api, config);
    return response; // returns full axios response (status, data, etc.)
  } catch (error) {
    const status = error?.response?.status;
    console.log('API Error:', status, error?.message);
    handleAuthorization(status);
    // Forward the error to the caller
    throw error.response || error;
  }
};

export const postApi = async (api, data) => {
  console.log({api, data})
  const config = {
    headers: {
      // Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .post(api, data, config)
      .then(resolve)
      .catch(err => {
        reject(err.response);
        handleAuthorization(err.response?.status);
      });
  });
};

export const postApiWithToken = async (api, data) => {
  console.log({ api, data })
  const state = store.getState()
  const token = state.login.data.jwtToken;
  console.log({token})
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await axios.post(api, data, config);
    return response; // returns full axios response (status, data, etc.)
  } catch (error) {
    const status = error?.response?.status;
    console.log('API Error:', status, error?.message);
    handleAuthorization(status);
    // Forward the error to the caller
    throw error.response || error;
  }
};

export const uploadApi = async (api, data) => {
  console.log({api, data})
  const state = store.getState()
  const token = state.login.data.jwtToken;
  console.log({token})
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.post(api, data, config);
    return response; // returns full axios response (status, data, etc.)
  } catch (error) {
    const status = error?.response?.status;
    console.log('API Error:', status, error?.message);
    handleAuthorization(status);
    // Forward the error to the caller
    throw error.response || error;
  }
};

export const putApi = async (api, data) => {
  console.log('put edit api calling')
  console.log({api, data})
  const state = store.getState()
  const token = state.login.data.data.token;
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + token,
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .put(api, data, config)
      .then(resolve)
      .catch(err => {
        reject(err.response);
        handleAuthorization(err.response?.status);
      });
  });
};

export const deleteApi = async (api, data) => {
  const state = store.getState()
  const token = state.login?.token;
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + '',
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .delete(api, data, config)
      .then(resolve)
      .catch(err => {
        reject(err.response);
        handleAuthorization(err.response?.status);
      });
  });
};

const handleAuthorization = (status) => {
  if (status === 401) {
    console.log('🔐 Unauthorized, clearing login...');
    store.dispatch(clearLogin());
    AsyncStorage.clear();
  }
};


