import { createSlice } from '@reduxjs/toolkit';
import { ENUM } from '../../utils/bgservices/enum'

const initialState = {
    data: []
  };

const activityPlanSlice = createSlice({
   name:'activityPlan',
   initialState,
   reducers: {
    // setActivityPlan: (state, action) => {
    //   state.data = action.payload.map(item => {
    //     const clockinSynced = item.mode >= 1;          // mode 1 or 2
    //     const clockoutSynced = item.mode === 2;        // mode 2 only
    //     const formSynced = item.activity_Id != null;   // form submitted

    //     const clockinSyncStatus =
    //   item.mode >= 1 ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING;

    // const clockoutSyncStatus =
    //   item.mode === 2 ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING;

    // const formSyncStatus =
    //   item.activity_Id != null ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING;
    
    //     return {
    //       ...item,
    //       clockinSynced,
    //       clockoutSynced,
    //       formSynced,
    //       clockinSyncStatus,
    //       clockoutSyncStatus,
    //       formSyncStatus,
    //     };
    //   });
    // },

   
    setActivityPlan: (state, action) => {

      const serverItems = action.payload.map(item => ({
        ...item,
        clockinSynced: item.mode >= 1,
        clockoutSynced: item.mode === 2,
        formSynced: item.activity_Id != null,
        clockinSyncStatus:
          item.mode >= 1 ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING,
        clockoutSyncStatus:
          item.mode === 2 ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING,
        formSyncStatus:
          item.activity_Id != null ? ENUM.SERVERSTATUS.COMPLETED : ENUM.SERVERSTATUS.PENDING,
      }));
    
      const localMap = new Map(
        state.data.map(item => [item.atP_Id, item])
      );
    
      serverItems.forEach(serverItem => {
    
        if (!localMap.has(serverItem.atP_Id)) {
          // ✅ Only NEW item add
          localMap.set(serverItem.atP_Id, serverItem);
        }
    
        // ❌ If already exists → DO NOTHING
        // Local data remains untouched
      });
    
      state.data = Array.from(localMap.values());
    },
   
    updateActivityPlanItem: (state, action) => {
      const { atP_Id, newData } = action.payload;
    
      console.log("🔷 updateActivityPlanItem CALLED");
      console.log("➡️ Payload:", { atP_Id, newData });
    
      const index = state.data.findIndex(item => item.atP_Id == atP_Id);
      console.log("➡️ Index Found:", index);
    
      if (index !== -1) {
        console.log("🟡 BEFORE UPDATE:", JSON.parse(JSON.stringify(state.data[index])));
        
        state.data[index] = {
          ...state.data[index],
          ...newData
        };
    
        console.log("🟢 AFTER UPDATE:", JSON.parse(JSON.stringify(state.data[index])));
      } else {
        console.log("❌ No item found for atP_Id:", atP_Id);
      }
    }
  },
})

export const { setActivityPlan, updateActivityPlanItem } = activityPlanSlice.actions;

export default activityPlanSlice.reducer;
