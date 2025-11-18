import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: []
  };

const activityPlanSlice = createSlice({
   name:'activityPlan',
   initialState,
   reducers: {
    setActivityPlan: (state, action) => { 
      state.data = action.payload;
    },

    updateActivityPlanItem: (state, action) => {
      const { atP_Id, newData } = action.payload;
      console.log({atP_Id, newData})
      const index = state.data.findIndex(item => item.atP_Id == atP_Id);
      console.log({index})
      if (index !== -1) {
        state.data[index] = {
          ...state.data[index],
          ...newData   // merge all fields into item directly
        };
      }
    }

  },
})

export const { setActivityPlan, updateActivityPlanItem } = activityPlanSlice.actions;

export default activityPlanSlice.reducer;
