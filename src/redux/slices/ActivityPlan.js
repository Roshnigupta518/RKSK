import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const activityPlanSlice = createSlice({
   name:'activityPlan',
   initialState,
   reducers: {
    setActivityPlan: (state, action) => {
      state.data = action.payload.map(item => {
        const clockinSynced = item.mode >= 1;          // mode 1 or 2
        const clockoutSynced = item.mode === 2;        // mode 2 only
        const formSynced = item.activity_Id != null;   // form submitted
    
        return {
          ...item,
          clockinSynced,
          clockoutSynced,
          formSynced,
        };
      });
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
