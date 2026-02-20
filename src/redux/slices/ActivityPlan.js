import { createSlice } from '@reduxjs/toolkit';
import { ENUM } from '../../utils/bgservices/enum'

const initialState = {
    data: []
  };

const activityPlanSlice = createSlice({
   name:'activityPlan',
   initialState,
   reducers: {
    setActivityPlan: (state, action) => {

      const isSubActivityFilled = (sub) => {
        return Boolean(
          sub.activity_DateTime ||
          sub.visit_Completion ||
          sub.activity_Details ||
          sub.photo_Path ||
          sub.video_Path ||
          sub.meeting_Participant
        );
      };

      const serverItems = action.payload.map(item => ({
        ...item,
         // ✅ Normalize subacitivity
        subacitivity: item.subacitivity?.map(sub => ({
          ...sub,
          isSynced: isSubActivityFilled(sub),   // 👈 Dynamic check
          serverSubActivityId: sub.subActivity_Id || null
        })) || [],

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
    },

    updateSubActivitySyncStatus: (state, action) => {
      console.log('updateSubActivitySyncStatus updateSubActivitySyncStatus')
      const { atP_Id, subId, serverSubActivityId } = action.payload;
      console.log({atP_Id, subId, serverSubActivityId})
      const planIndex = state.data.findIndex(
        item => item.atP_Id == atP_Id
      );
     console.log({planIndex})
      if (planIndex === -1) return;
    
      const subIndex = state.data[planIndex].subacitivity?.findIndex(
        sub => sub.id == subId
      );
    console.log({subIndex})
      if (subIndex === -1) return;
    
      state.data[planIndex].subacitivity[subIndex] = {
        ...state.data[planIndex].subacitivity[subIndex],
        isSynced: true,
        serverSubActivityId: serverSubActivityId
      };
      console.log("🟢 AFTER UPDATE updateSubActivitySyncStatus:", JSON.parse(JSON.stringify(state.data[planIndex])));
    }
    
  },
})

export const { setActivityPlan, updateActivityPlanItem, updateSubActivitySyncStatus } = activityPlanSlice.actions;

export default activityPlanSlice.reducer;
