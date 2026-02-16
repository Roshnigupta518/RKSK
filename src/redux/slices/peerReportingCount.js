import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: {
      peerEducatorId : '',
      reportingCount : ''
    }
  };

const peerReportingCountSlice = createSlice({
   name:'disclaimerStatus',
   initialState,
   reducers: {
    setPeerEducatorReportCount: (state, action) => { 
      state.data.reportingCount = action.payload;
    },

    setPeerEducatorId: (state, action) => {
      console.log({setPeerEducatorId: action.payload})
      state.data.peerEducatorId = action.payload
    },

    clearPeerEducatorId : (state, action) => {
      state.data = {
      peerEducatorId : '',
      reportingCount : ''
      }
    }
  },
})

export const { setPeerEducatorReportCount, setPeerEducatorId, clearPeerEducatorId } = peerReportingCountSlice.actions;

export default peerReportingCountSlice.reducer;
