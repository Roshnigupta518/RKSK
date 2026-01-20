import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFromLocal, saveToLocal } from '../../utils/services/storage';
import { getMastersDataHandle } from '../../utils/services';

export const fetchMasters = createAsyncThunk(
  'masters/fetchMasters',
  async ({ flag, id = 0 }, { rejectWithValue }) => {
    try {
      const data = await getMastersDataHandle({ flag, id });
      return { flag, id, data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const MastersSlice = createSlice({
  name: 'masters',
  initialState: {
    districtList: [],
    blockByDistrict: {},
    ashaSahyogiByBlock: {},
    ashaBySahyogi: {},
    villageByAsha: {},
    peerEducatorByAsha: {},
    genderByPeerEducator: {},
    loading: false,
  },
  

  reducers: {
    setLocalMasters: (state, action) => {
      const { type, id, data } = action.payload;
    
      if (type === 'district') state.districtList = data;
      if (type === 'block') state.blockByDistrict[id] = data;
      if (type === 'ashaSahyogi') state.ashaSahyogiByBlock[id] = data;
      if (type === 'asha') state.ashaBySahyogi[id] = data;
      if (type === 'village') state.villageByAsha[id] = data;
      if (type === 'peerEducator') state.peerEducatorByAsha[id] = data;
      if (type === 'peerEducatorGender') state.genderByPeerEducator[id] = data;
    },
    

    clearLowerMasters: (state, action) => {
      const level = action.payload;

      if (level === 'district') {
        state.blockByDistrict = {};
        state.ashaSahyogiByBlock = {};
        state.ashaBySahyogi = {};
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
      }

      if (level === 'block') {
        state.ashaSahyogiByBlock = {};
        state.ashaBySahyogi = {};
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
      }

      if (level === 'ashaSahyogi') {
        state.ashaBySahyogi = {};
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
      }

      if (level === 'asha') {
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
      }

      if (level === 'peerEducator') {
        state.genderByPeerEducator = {};
      }
    },
  },

  extraReducers: builder => {
    builder
      .addCase(fetchMasters.pending, state => {
        state.loading = true;
      })
      .addCase(fetchMasters.fulfilled, (state, action) => {
        state.loading = false;

        const { flag, id, data } = action.payload;

        switch (flag) {
          case 2: // District
            state.districtList = data;
            saveToLocal('DISTRICT_LIST', data);
            break;

          case 3: // Block by District
            state.blockByDistrict[id] = data;
            saveToLocal(`BLOCK_${id}`, data);
            break;

          case 7: // ASHA Sahyogi by Block
            state.ashaSahyogiByBlock[id] = data;
            saveToLocal(`ASHA_SAHYOGI_${id}`, data);
            break;

          case 71: // ASHA by ASHA Sahyogi (if separate flag)
            state.ashaBySahyogi[id] = data;
            saveToLocal(`ASHA_${id}`, data);
            break;

          case 8: // Village by ASHA
            state.villageByAsha[id] = data;
            saveToLocal(`VILLAGE_${id}`, data);
            break;

          case 13: // Peer Educator by ASHA
            state.peerEducatorByAsha[id] = data;
            saveToLocal(`PEER_EDUCATOR_${id}`, data);
            break;

          case 14: // Gender by Peer Educator
            state.genderByPeerEducator[id] = data;
            saveToLocal(`GENDER_${id}`, data);
            break;
        }
      })
      .addCase(fetchMasters.rejected, state => {
        state.loading = false;
      });
  },
});

export const {
  setLocalMasters,
  clearLowerMasters,
} = MastersSlice.actions;

export default MastersSlice.reducer;
