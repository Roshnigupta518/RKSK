import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const materialSlice = createSlice({
   name:'Materials',
   initialState,
   reducers: {
    setMaterialList: (state, action) => { 
      state.data = action.payload;
    },
  },
})

export const { setMaterialList } = materialSlice.actions;

export default materialSlice.reducer;
