import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../redux/store';
import { clearLogin } from '../../redux/slices/login';
import { SecureTokenService } from '../security';
import { logger } from '../logger';

// F-04: the JWT no longer lives in redux-persist / AsyncStorage. Every
// authenticated request reads it from the Keychain-backed
// SecureTokenService (in-memory cached, Keychain-backed for cold starts).
const readAuthToken = async () => {
  const token = await SecureTokenService.getToken();
  return token || '';
};

// F-05: log helpers below never receive the token, request bodies, or
// response bodies — only the HTTP method + URL path + status. This matches
// the audit-recommended posture: transport metadata is fine, credentials /
// PII are not.
const logHttpError = (method, url, error) => {
  logger.error('http error', {
    method,
    url,
    status: error?.response?.status,
    message: error?.message,
  });
};

export const getApi = async (api) => {
  const token = await readAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await axios.get(api, config);
    return response;
  } catch (error) {
    logHttpError('GET', api, error);
    await handleAuthorization(error?.response?.status);
    throw error.response || error;
  }
};

export const postApi = async (api, data) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .post(api, data, config)
      .then(resolve)
      .catch(async (err) => {
        logHttpError('POST', api, err);
        await handleAuthorization(err.response?.status);
        reject(err.response);
      });
  });
};

export const postApiWithToken = async (api, data) => {
  const token = await readAuthToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await axios.post(api, data, config);
    return response;
  } catch (error) {
    logHttpError('POST', api, error);
    await handleAuthorization(error?.response?.status);
    throw error.response || error;
  }
};

export const uploadApi = async (api, data) => {
  const token = await readAuthToken();
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.post(api, data, config);
    return response;
  } catch (error) {
    logHttpError('POST', api, error);
    await handleAuthorization(error?.response?.status);
    throw error.response || error;
  }
};

export const putApi = async (api, data) => {
  const token = await readAuthToken();
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .put(api, data, config)
      .then(resolve)
      .catch(async (err) => {
        logHttpError('PUT', api, err);
        await handleAuthorization(err.response?.status);
        reject(err.response);
      });
  });
};

export const deleteApi = async (api, data) => {
  const token = await readAuthToken();
  const config = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  return new Promise((resolve, reject) => {
    axios
      .delete(api, { ...config, data })
      .then(resolve)
      .catch(async (err) => {
        logHttpError('DELETE', api, err);
        await handleAuthorization(err.response?.status);
        reject(err.response);
      });
  });
};

const handleAuthorization = async (status) => {
  if (status === 401) {
    store.dispatch(clearLogin());
    await SecureTokenService.clearToken();
    await AsyncStorage.clear();
  }
};
