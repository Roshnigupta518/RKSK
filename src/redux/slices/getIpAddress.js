import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState= {
  data: null,
};

export const ipAddressSlice = createSlice({
  name: 'ipAddress',
  initialState,
  reducers: {
    setIpAddressLogin: (state, action) => { 
      state.data = action.payload;
    },
  },
});

export const { setIpAddressLogin} = ipAddressSlice.actions;

export default ipAddressSlice.reducer;
