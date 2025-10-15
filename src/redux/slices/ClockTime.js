import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  loginDetails: null,
  logoutDetails: null,
};

export const ClockTimeSlice = createSlice({
  name: 'ClockTime',
  initialState,
  reducers: {
    setClockIn: (state, action) => {
      state.loginDetails = action.payload;
    },

    setClockOut: (state, action) => {
      state.logoutDetails = action.payload;
    },

    clearClock: (state, action) => {
      state.loginDetails = null;
      state.logoutDetails = null;
    },
  },
});

export const {setClockIn, setClockOut, clearClock} = ClockTimeSlice.actions;

export default ClockTimeSlice.reducer;
