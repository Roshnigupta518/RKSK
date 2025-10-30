import { createSlice } from '@reduxjs/toolkit';
import { images } from '../../global/theme';

const initialState = {
    data: false
  };

const disclaimerSlice = createSlice({
   name:'disclaimerStatus',
   initialState,
   reducers: {
    setDisClaimerStatus: (state, action) => { 
      state.data = action.payload;
    },
  },
})

export const { setDisClaimerStatus } = disclaimerSlice.actions;

export default disclaimerSlice.reducer;
