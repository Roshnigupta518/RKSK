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
  },
})

export const { setActivityPlan } = activityPlanSlice.actions;

export default activityPlanSlice.reducer;
