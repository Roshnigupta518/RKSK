import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  }

const PeerBridageListSlice = createSlice({
  name: 'PeerBridageList',
  initialState,
  reducers: {
    setPeerBridageList: (state, action) => {
      const patients = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
    
      patients.forEach(patient => {
        const index = state.data.findIndex(
          p => p.clientId === patient.clientId
        );
    
        const normalizedPatient = {
          retryCount: patient.retryCount ?? 0,
          ...patient,
        };
    
        if (index >= 0) {
          //  Existing ko update karo
          state.data[index] = {
            ...state.data[index],
            ...normalizedPatient,
          };
        } else {
          //  New ko push karo
          state.data.push(normalizedPatient);
        }
      });
    
      //  Latest first sort (createdAt ya fallback pe)
      state.data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
    },
    

    updateSavePeerBridageSyncStatus: (state, action) => {
      const { syncStatus, clientId, id } = action.payload;
      console.log({syncStatus, clientId, id})
      const itemToUpdate = state.data?.find(item => item.clientId === clientId);
      console.log({itemToUpdate})
      if (itemToUpdate) {
        itemToUpdate.syncStatus = syncStatus;
        itemToUpdate.id = id
      }
    },

    incrementPeerBridageRetryCount: (state, action) => {
      const { clientId } = action.payload;
      const item = state.data.find(i => i.clientId === clientId);
      if (item) {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    },

    removePeerBridageByClientId: (state, action) => {
      const { clientId } = action.payload;
      state.data = state.data.filter(item => item.clientId !== clientId);
    },
  },
});

export const {
  setPeerBridageList,
  updateSavePeerBridageSyncStatus,
  incrementPeerBridageRetryCount,
  removePeerBridageByClientId,
} = PeerBridageListSlice.actions;

export default PeerBridageListSlice.reducer;