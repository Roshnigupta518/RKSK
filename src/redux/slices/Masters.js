import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFromLocal, saveToLocal } from '../../utils/services/storage';
import { getMastersDataHandle, mapToPickerFormat } from '../../utils/services';
import { getApi } from '../../utils/apicalls';
import { API } from '../../utils/endpoints';

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

export const fetchAshaByVacantSupervisor = createAsyncThunk(
  'masters/fetchAshaByVacantSupervisor',
  async ({ blockId }, { rejectWithValue }) => {
    try {
      console.log('fetchAshaByVacantSupervisor fetchAshaByVacantSupervisor')
      
      const url = `${API.GET_Asha_ByVacant_Ashasahyogi}?Ashasahyogiid=0&blockid=${blockId}`
      const response = await getApi(url)

      console.log({fetchAshaByVacantSupervisor:response})

      const finalData = mapToPickerFormat(response.data || [])
      let data = finalData || [];
      data = [
        { label: 'Not available', value: 0 },
        ...(finalData || []),
      ];
      return { blockId, data };
    } catch (err) {
      console.log({err})
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
    villageByBlock: {}
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
      if (type === 'villageByBlock') state.villageByBlock[id] = data;
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
        state.villageByBlock = []
      }

      if (level === 'block') {
        state.ashaSahyogiByBlock = {};
        state.ashaBySahyogi = {};
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
        state.villageByBlock = []
      }

      if (level === 'ashaSahyogi') {
        state.ashaBySahyogi = {};
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
        state.villageByBlock = []
      }

      if (level === 'asha') {
        state.villageByAsha = {};
        state.peerEducatorByAsha = {};
        state.genderByPeerEducator = {};
        state.villageByBlock = []
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

            case 4: // ASHA Sahyogi by Block ✅
            state.ashaSahyogiByBlock[id] = data;
            saveToLocal(`ASHA_SAHYOGI_${id}`, data);
            break;

          case 7:
          state.ashaBySahyogi[id] = data;
          saveToLocal(`ASHA_${id}`, data);
          break;

          // case 7: // ASHA Sahyogi by Block
          //   state.ashaSahyogiByBlock[id] = data;
          //   saveToLocal(`ASHA_SAHYOGI_${id}`, data);
          //   break;

          // case 71: // ASHA by ASHA Sahyogi (if separate flag)
          //   state.ashaBySahyogi[id] = data;
          //   saveToLocal(`ASHA_${id}`, data);
          //   break;

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

          case 19: // village by block if asha is not available
            state.villageByBlock[id] = data;
            saveToLocal(`VILLAGE_BY_BLOCK_${id}`, data);
            break; 
        }
      })
      .addCase(fetchMasters.rejected, state => {
        state.loading = false;
      })
      .addCase(fetchAshaByVacantSupervisor.fulfilled, (state, action) => {
        const { blockId, data } = action.payload;
      
        // yaha id supervisor ka 0 hoga
        state.ashaBySahyogi[0] = data;
      
        saveToLocal(`ASHA_0_${blockId}`, data);
      });
  },
});

export const {
  setLocalMasters,
  clearLowerMasters,
} = MastersSlice.actions;

export default MastersSlice.reducer;
