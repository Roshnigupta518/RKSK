import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../redux/store';
import { clearLogin } from '../../redux/slices/login';
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



// import { fetch } from 'react-native-ssl-pinning';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { store } from '../../redux/store';
// import { clearLogin } from '../../redux/slices/login';
// import axios from 'axios';

// // Common header generator
// const getHeaders = (token = null, isFormData = false) => ({
//   ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   Accept: 'application/json',
//   'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
// });

// // Use react-native-ssl-pinning fetch for HTTPS dev bypass
// const sslFetch = async (url, method, body = null, token = null, isFormData = false) => {
//   const headers = getHeaders(token, isFormData);
//   const options = {
//     method,
//     pkPinning: false, // disables strict key pinning
//     sslPinning: { certs: [] }, // bypass SSL verification temporarily
//     headers,
//     timeoutInterval: 15000,
//     // disableAllSecurity: true, // ⚠️ this disables SSL validation
//   };
//   if (body) options.body = isFormData ? body : JSON.stringify(body);

//   const res = await fetch(url, options);
//   const data = await res.json();
//   return data;
// };

// // --------------------- GET ---------------------
// export const getApi = async (api) => {
//   const state = store.getState();
//   const token = state?.login?.data?.data?.token;

//   // For HTTPS self-signed APIs
//   if (api.startsWith('https://')) {
//     try {
//       const data = await sslFetch(api, 'GET', null, token);
//       return { data };
//     } catch (err) {
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   // Else normal axios for HTTP
//   const config = { headers: getHeaders(token) };
//   return axios(api, config);
// };

// // --------------------- POST ---------------------
// export const postApi = async (api, data) => {
//   console.log({ api, data });

//   // For HTTPS self-signed API
//   if (api.startsWith('https://')) {
//     try {
//       const res = await sslFetch(api, 'POST', data);
//       return { data: res };
//     } catch (err) {
//       console.log('SSL fetch error', err);
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   // Normal axios fallback
//   const config = { headers: getHeaders() };
//   return axios.post(api, data, config);
// };

// // --------------------- POST with Token ---------------------
// export const postApiWithToken = async (api, data) => {
//   const state = store.getState();
//   const token = state?.login?.data?.data?.token;

//   if (api.startsWith('https://')) {
//     try {
//       const res = await sslFetch(api, 'POST', data, token);
//       return { data: res };
//     } catch (err) {
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   const config = { headers: getHeaders(token) };
//   return axios.post(api, data, config);
// };

// // --------------------- Upload ---------------------
// export const uploadApi = async (api, data) => {
//   const state = store.getState();
//   const token = state?.login?.data?.data?.token;

//   if (api.startsWith('https://')) {
//     try {
//       const res = await sslFetch(api, 'POST', data, token, true);
//       return { data: res };
//     } catch (err) {
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   const config = { headers: getHeaders(token, true) };
//   return axios.post(api, data, config);
// };

// // --------------------- PUT ---------------------
// export const putApi = async (api, data) => {
//   const state = store.getState();
//   const token = state?.login?.data?.data?.token;

//   if (api.startsWith('https://')) {
//     try {
//       const res = await sslFetch(api, 'PUT', data, token, true);
//       return { data: res };
//     } catch (err) {
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   const config = { headers: getHeaders(token, true) };
//   return axios.put(api, data, config);
// };

// // --------------------- DELETE ---------------------
// export const deleteApi = async (api) => {
//   const state = store.getState();
//   const token = state?.login?.data?.data?.token;

//   if (api.startsWith('https://')) {
//     try {
//       const res = await sslFetch(api, 'DELETE', null, token);
//       return { data: res };
//     } catch (err) {
//       handleAuthorization(err?.status);
//       throw err;
//     }
//   }

//   const config = { headers: getHeaders(token) };
//   return axios.delete(api, config);
// };

// // --------------------- AUTH HANDLER ---------------------
// const handleAuthorization = (status) => {
//   console.log({ status });
//   if (status === 401) {
//     store.dispatch(clearLogin());
//     AsyncStorage.clear();
//   }
// };
