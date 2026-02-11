import { atpFormRequest, activityLoginRequest } from "../services";
import { updateActivityPlanItem } from "../../redux/slices/ActivityPlan";
import { store } from "../../redux/store";
import { removeFromQueue } from "../../redux/slices/queueSlice";
import { reStartBackgroundService } from "./backgroundService";
import { syncTaskName } from "./backgroundTaskEnum";
import { ENUM } from "./enum";

export const processQueueItem = async (item) => {
  try {
    console.log({ item })
    console.log("Processing item:", item.type);

    if (item.type === "CLOCK_IN") {
      try {
        const response = await activityLoginRequest(item.payload);
        console.log({ response })
        store.dispatch(
          updateActivityPlanItem({
            atP_Id: item.payload.atP_Id,
            newData: {
              clockinSynced: true,
              clockinSyncStatus: ENUM.SERVERSTATUS.COMPLETED,
              clockinError: null
            }
          })
        );
        reStartBackgroundService(syncTaskName.syncGetAtpList)
      } catch (error) {
        store.dispatch(updateActivityPlanItem({
          atP_Id: item.payload.atP_Id,
          newData: {
            clockinSynced: false,
            clockinSyncStatus: ENUM.SERVERSTATUS.FAILED,
            clockinError: error?.message || "Network error"
          }
        }));

        // ❌ queue se remove mat karo
        return;
      }
    }

    if (item.type === "FORM") {
      const formdata = new FormData();
      formdata.append("ATP_Id", item.payload.atP_Id);
      formdata.append("ActivityDateTime", item.payload.activity_DateTime);
      formdata.append("ActivityDetails", item.payload.activity_Details);
      formdata.append("Address", item.payload.Address);
      formdata.append("Latitude", item.payload.Latitude);
      formdata.append("Longitude", item.payload.Longitude);
      formdata.append("MeetingParticipant", item.payload.meeting_Participant);
      formdata.append("Other_MeetingParticipant", item.payload.other_MeetingParticipant || '');
      formdata.append("Photo", item.payload.photo_Path);
      formdata.append("visit_PurposeId_Id", item.payload.PlannedActivity);
      formdata.append("Video", item.payload.video_Path);
      formdata.append("VisitCompletion", item.payload.visit_Completion);
      formdata.append("Other_Activity", item.payload.other_Activity || '');
      formdata.append("SubActivity", item.payload.selectedSubActivity || '');
      formdata.append("Subactivity_Other", item.payload.Subactivity_Other || '');
      formdata.append('CreatedBy', item.payload.CreatedBy)
       try{
      const response = await atpFormRequest(formdata);
      console.log({ response })
      store.dispatch(
        updateActivityPlanItem({
          atP_Id: item.payload.atP_Id,
          newData: {
            formSynced: true,
            activity_Id: response?.activityIds[0],
            formSyncStatus: ENUM.SERVERSTATUS.COMPLETED
          }
        })
      );
      reStartBackgroundService(syncTaskName.syncGetAtpList)
    }catch(error){
      store.dispatch(
        updateActivityPlanItem({
          atP_Id: item.payload.atP_Id,
          newData: {
            formSynced: false,
            formSyncStatus: ENUM.SERVERSTATUS.FAILED
          }
        })
      );
    }
    }

    if (item.type === "CLOCK_OUT") {
      try {
        const response = await activityLoginRequest(item.payload);
        console.log({ response })
        store.dispatch(
          updateActivityPlanItem({
            atP_Id: item.payload.atP_Id,
            newData: {
              clockoutSynced: true,
              clockoutSyncStatus: ENUM.SERVERSTATUS.COMPLETED,
              clockoutError: null
            }
          })
        );
        reStartBackgroundService(syncTaskName.syncGetAtpList)
      } catch (error) {
        store.dispatch(updateActivityPlanItem({
          atP_Id: item.payload.atP_Id,
          newData: {
            clockoutSynced: false,
            clockoutSyncStatus: ENUM.SERVERSTATUS.FAILED,
            clockoutError: error?.message || "Network error"
          }
        }));

        // ❌ queue se remove mat karo
        return;
      }
    }

    // remove processed item
    store.dispatch(removeFromQueue(item.queueId));
  } catch (err) {
    console.log("FAILED ITEM", item.queueId, err);
    // do not remove → will retry again
  }
};

export const processQueue = async (isGetInProgress) => {
  const state = store.getState();
  const queue = state.queue.pending;
  console.log("Queue size:", queue.length);
  // if(isGetInProgress){
  if (!queue || queue.length === 0) {
    console.log("Queue empty, nothing to process");
    return "EMPTY";
  }
  for (const item of queue) {
    await processQueueItem(item);
  }
  return "DONE";
  // }
};
