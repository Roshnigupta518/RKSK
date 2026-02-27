import { atpFormRequest, activityLoginRequest } from "../services";
import { updateActivityPlanItem, updateSubActivitySyncStatus } from "../../redux/slices/ActivityPlan";
import { store } from "../../redux/store";
import { addToQueue, removeFromQueue } from "../../redux/slices/queueSlice";
import { reStartBackgroundService } from "./backgroundService";
import { syncTaskName } from "./backgroundTaskEnum";
import { ENUM } from "./enum";

// 🔐 Prevent duplicate processing
let processingIds = new Set();

export const processQueueItem = async (item) => {

  if (!item) return;

  // 🔐 Prevent double processing
  if (processingIds.has(item.queueId)) {
    console.log("⛔ Already processing:", item.queueId);
    return;
  }

  processingIds.add(item.queueId);

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

      if (!item) return;

      const state = store.getState();

      const plan = state.activityPlan.data.find(
        p => p.atP_Id == item.payload.atP_Id
      );

      // ❌ Clock-In sync nahi hua
      if (!plan?.clockinSynced) {

        console.log("⛔ Skipping FORM → Clock-In not synced");
       
        processingIds.delete(item.queueId);
       
        return; // queue me rehne do
       }

      try {
        const isSubActivityPlan = item.payload.PlannedActivity == 2;
        if (isSubActivityPlan) {

          const subActivities = item.payload.subacitivity || [];

          const filledSubs = subActivities.filter(sub =>
            sub.isSynced === false &&
            !sub.serverSubActivityId &&
            (
              sub.photo_Path ||
              sub.video_Path ||
              sub.meeting_Participant ||
              sub.activity_Details ||
              sub.activity_DateTime ||
              sub.visit_Completion
            )
          );


          for (const sub of filledSubs) {

            const formdata = new FormData();

            // 🔹 Common keys (always go)
            formdata.append("ATP_Id", item.payload.atP_Id);
            formdata.append("visit_PurposeId_Id", item.payload.PlannedActivity);
            formdata.append("CreatedBy", item.payload.CreatedBy);

            // 🔹 Subactivity specific
            formdata.append("SubActivity", sub.id);
            formdata.append("Subactivity_Other", sub.SubActivity_Other || '');

            formdata.append("ActivityDateTime", sub.activity_DateTime);
            formdata.append("ActivityDetails", sub.activity_Details);
            formdata.append("Latitude", sub.latitude);
            formdata.append("Longitude", sub.longititude);
            formdata.append("Address", sub.Address);
            formdata.append("MeetingParticipant", sub.meeting_Participant || '');
            formdata.append("Other_MeetingParticipant", sub.other_MeetingParticipant || '');
            formdata.append("VisitCompletion", sub.visit_Completion);
            formdata.append("Other_Activity", sub.other_Activity || '');

            if (sub.photo_Path)
              formdata.append("Photo", sub.photo_Path);

            if (sub.video_Path)
              formdata.append("Video", sub.video_Path);

            const response = await atpFormRequest(formdata);
            console.log({ response })

            const serverId = response?.activityIds?.[0]?.subActivity_Id;
            console.log({ serverId })
            store.dispatch(
              updateSubActivitySyncStatus({
                atP_Id: item.payload.atP_Id,
                subId: sub.id,
                serverSubActivityId: serverId
              })
            );

            // ✅ AFTER LOOP → check completion
            const state = store.getState();
            const plan = state.activityPlan.data.find(
              p => p.atP_Id == item.payload.atP_Id
            );

            if (plan?.subacitivity?.length) {

              const filledSubsLatest = plan.subacitivity.filter(sub =>
                sub.photo_Path ||
                sub.video_Path ||
                sub.meeting_Participant ||
                sub.activity_Details ||
                sub.activity_DateTime ||
                sub.visit_Completion
              );

              const allFilledSynced = filledSubsLatest.every(
                sub => sub.isSynced === true
              );

              if (filledSubsLatest.length > 0 && allFilledSynced) {
                store.dispatch(
                  updateActivityPlanItem({
                    atP_Id: item.payload.atP_Id,
                    newData: {
                      formSynced: true,
                      formSyncStatus: ENUM.SERVERSTATUS.COMPLETED
                    }
                  })
                );
              }
            }

          }
        }

        // ============================
        // 🟢 CASE 2 → Purpose ≠ 2
        // ============================
        else {

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

          const response = await atpFormRequest(formdata);
          console.log({ response })
          store.dispatch(
            updateActivityPlanItem({
              atP_Id: item.payload.atP_Id,
              newData: {
                formSynced: true,
                activity_Id: response?.activityIds?.[0]?.subActivity_Id,
                formSyncStatus: ENUM.SERVERSTATUS.COMPLETED
              }
            })
          );
          reStartBackgroundService(syncTaskName.syncGetAtpList)
        }
      } catch (error) {
        store.dispatch(
          updateActivityPlanItem({
            atP_Id: item.payload.atP_Id,
            newData: {
              formSynced: false,
              formSyncStatus: ENUM.SERVERSTATUS.FAILED
            }
          })
        );
      } finally {
        console.log('finally removed')
        processingIds.delete(item.queueId);
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
