import { createSlice } from "@reduxjs/toolkit";
import uuid from "react-native-uuid";

const initialState = {
  pending: [],
};

const queueSlice = createSlice({
  name: "queue",
  initialState,
  reducers: {
    addToQueue: (state, action) => {
      const existing = state.pending.find(
        item =>
          item.type === action.payload.type &&
          item.payload.atP_Id === action.payload.payload.atP_Id
      );
    
      if (existing) {
        // 🔁 Replace payload instead of pushing new
        existing.payload = action.payload.payload;
      } else {
        state.pending.push({
          queueId: uuid.v4(),
          ...action.payload,
        });
      }
    },
    
    removeFromQueue: (state, action) => {
      console.log('removed queue id', action.payload)
      state.pending = state.pending.filter(
        item => item.queueId !== action.payload
      );
    },
  },
});

export const { addToQueue, removeFromQueue } = queueSlice.actions;
export default queueSlice.reducer;
