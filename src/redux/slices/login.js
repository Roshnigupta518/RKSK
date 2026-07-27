import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: null,
};

export const loginSlice = createSlice({
  name: 'Login',
  initialState,
  reducers: {
    /**
     * Persist the *non-secret* profile fields returned by the login flow.
     * The JWT itself must be saved separately via SecureTokenService and
     * MUST NOT be included in this payload — see F-04 in the security
     * audit. If a caller still passes `jwtToken`, we strip it here as a
     * defensive measure so it can never reach redux-persist / AsyncStorage.
     */
    setLogin: (state, action) => {
      const payload = action.payload || {};
      const safe = { ...payload };
      delete safe.jwtToken;
      state.data = safe;
    },
    clearLogin: (state) => {
      state.data = null;
    },
  },
});

export const { setLogin, clearLogin } = loginSlice.actions;

export default loginSlice.reducer;
