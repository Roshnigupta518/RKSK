import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const PeerEducatorListSlice = createSlice({
   name:'PeerEducatorList',
   initialState,
   reducers: {
    setPeerEducatorList: (state, action) => {
        state.data = action.payload
    }
   }
})

export const { setPeerEducatorList } = PeerEducatorListSlice.actions;

export default PeerEducatorListSlice.reducer;