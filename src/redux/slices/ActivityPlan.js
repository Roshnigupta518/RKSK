import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const activityPlanSlice = createSlice({
   name:'activityPlan',
   initialState,
   reducers: {
    // setActivityPlan: (state, action) => { 
    //   state.data = action.payload;
    // },

    setActivityPlan: (state, action) => {
      state.data = action.payload.map(item => ({
        ...item,
        clockinSynced: false,
        formSynced: false,
        clockoutSynced: false,
      }));
    },

    // updateActivityPlanItem: (state, action) => {
    //   const { atP_Id, newData } = action.payload;
    //   console.log({atP_Id, newData})
    //   const index = state.data.findIndex(item => item.atP_Id == atP_Id);
    //   console.log({index})
    //   if (index !== -1) {
    //     state.data[index] = {
    //       ...state.data[index],
    //       ...newData   // merge all fields into item directly
    //     };
    //   }
    // }


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
