import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState= {
  data: null,
};

export const loginSlice = createSlice({
  name: 'Login',
  initialState,
  reducers: {
    setLogin: (state, action) => { 
      state.data = action.payload;
    },
    clearLogin: (state) => {
      state.data = null;
    },
  },
});

export const { setLogin, clearLogin } = loginSlice.actions;

export default loginSlice.reducer;
