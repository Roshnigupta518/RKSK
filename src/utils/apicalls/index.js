import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../redux/store';
import { clearLogin } from '../../redux/slices/loginSlice';

export const getApi = async (api) => {

  const state = store.getState()
  const token = state.login.data.data.token;

  const config = {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  };
  console.log({api, token})
  return new Promise((resolve, reject) => {
    axios(api, config)
      .then(resolve)
      .catch(err => {
        reject(err.response);
        handleAuthorization(err.response?.status);
      });
  });
};

export const postApi = async (api, data) => {
  // console.log({api, data})
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
  const token = state.login.data.data.token;
  const config = {
    headers: {
      Authorization: 'Bearer ' + token,
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

export const uploadApi = async (api, data) => {
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
      .post(api, data, config)
      .then(resolve)
      .catch(err => {
        reject(err.response);
        handleAuthorization(err.response?.status);
      });
  });
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

const handleAuthorization = status => {
  console.log({status})
  // || status === undefined
  if (status === 401 ) {
    store.dispatch(clearLogin());
    AsyncStorage.clear();
  }
};