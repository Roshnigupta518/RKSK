import { store } from ".";

export const isUserLoggedIn = () => {
    const loginData = store.getState().login?.data;
    console.log('isUserLoggedIn', loginData, !!loginData);
    return !!loginData;
  };