import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState= {
  data: null,
};

export const profileSlice = createSlice({
  name: 'Profile',
  initialState,
  reducers: {
    setProfileData: (state, action) => { 
      state.data = action.payload;
    },
   
  },
});

export const { setProfileData } = profileSlice.actions;

export default profileSlice.reducer;
