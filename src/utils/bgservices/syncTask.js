import { syncTaskName } from "./backgroundTaskEnum";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDasboardDataHandle, getProfileDataHandle, getATPListRequest } from "../services";
import { processQueue } from "./queueProcessor";

const setSyncStatus = async taskName => {
    const status = {lastSyncOn: new Date()};
    await AsyncStorage.setItem(taskName + 'Status', JSON.stringify(status));
};

export const syncDashboard = async () => {
    getDasboardDataHandle();
    await setSyncStatus(syncTaskName.syncDashboard);
};

export const syncProfileData = async () => {
    getProfileDataHandle();
    await setSyncStatus(syncTaskName.syncGetProfile);
};

export const syncATPListData = async () => {
    getATPListRequest();
    await setSyncStatus(syncTaskName.syncGetAtpList);
};

export const syncATPFormData = async(isSyncInProgress) => {
    console.log("Processing Queue...",isSyncInProgress);
    const queueProcessed = await processQueue(isSyncInProgress);
  
    if (queueProcessed === "EMPTY") {
      console.log("Queue empty → skipping queue sync");
    }
    await setSyncStatus(syncTaskName.syncAcitivityQueue);
}



