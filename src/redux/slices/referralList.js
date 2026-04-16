import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  }

const ReferralListSlice = createSlice({
  name: 'ReferralList',
  initialState,
  reducers: {
    setIndividualReferralList: (state, action) => {
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
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });
    },
    

    updateSaveReferralSyncStatus: (state, action) => {
      const { syncStatus, clientId, id } = action.payload;
      console.log({syncStatus, clientId, id})
      const itemToUpdate = state.data?.find(item => item.clientId === clientId);
      console.log({itemToUpdate})
      if (itemToUpdate) {
        itemToUpdate.syncStatus = syncStatus;
        itemToUpdate.id = id
      }
    },

    incrementReferralRetryCount: (state, action) => {
      const { clientId } = action.payload;
      const item = state.data.find(i => i.clientId === clientId);
      if (item) {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    },

    removeReferralByClientId: (state, action) => {
      const { clientId } = action.payload;
      state.data = state.data.filter(item => item.clientId !== clientId);
    },
  },
});

export const {
  setIndividualReferralList,
  updateSaveReferralSyncStatus,
  incrementReferralRetryCount,
  removeReferralByClientId,
} = ReferralListSlice.actions;

export default ReferralListSlice.reducer;