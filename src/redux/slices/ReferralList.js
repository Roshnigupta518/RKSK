import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  }

const PeerReferralListSlice = createSlice({
  name: 'PeerReferralList',
  initialState,
  reducers: {
    setPeerReferralList: (state, action) => {
      const incoming = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
    
      state.data = incoming.map(item => ({
        retryCount: item.retryCount ?? 0,   
        ...item,
      }));
    
      state.data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    },    

    updateSavePeerReferralSyncStatus: (state, action) => {
      const { syncStatus, clientId } = action.payload;
      const itemToUpdate = state.data?.find(item => item.clientId === clientId);
      if (itemToUpdate) {
        itemToUpdate.syncStatus = syncStatus;
      }
    },

    incrementPeerRetryCount: (state, action) => {
      const { clientId } = action.payload;
      const item = state.data.find(i => i.clientId === clientId);
      if (item) {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    },

    removePeerReferralByClientId: (state, action) => {
      const { clientId } = action.payload;
      state.data = state.data.filter(item => item.clientId !== clientId);
    },
  },
});

export const {
  setPeerReferralList,
  updateSavePeerReferralSyncStatus,
  incrementPeerRetryCount,
  removePeerReferralByClientId,
} = PeerReferralListSlice.actions;

export default PeerReferralListSlice.reducer;