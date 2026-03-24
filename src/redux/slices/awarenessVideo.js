import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const awarenessVideoSlice = createSlice({
   name:'AwarenessVideo',
   initialState,
   reducers: {
    setVideoList: (state, action) => { 
      state.data = action.payload;
    },
  },
})

export const { setVideoList } = awarenessVideoSlice.actions;

export default awarenessVideoSlice.reducer;
