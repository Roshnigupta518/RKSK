import { syncTaskName } from "./backgroundTaskEnum";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDasboardDataHandle, getProfileDataHandle, getATPListRequest, getPeerEducatorListHandle, getMastersDataHandle, getPeerEducatorReferralListHandle } from "../services";
import { processQueue } from "./queueProcessor";
import { savePeerEducatorFormDatafromRedux } from "../services";

const setSyncStatus = async taskName => {
    const status = { lastSyncOn: new Date() };
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

export const syncPeerEducatorList = async () => {
    getPeerEducatorListHandle();
    await setSyncStatus(syncTaskName.syncPeerEducatorList);
};

export const syncPeerEducatorReferralList = async () => {
    getPeerEducatorReferralListHandle();
    await setSyncStatus(syncTaskName.syncPeerEducatorReferralList);
};

export const syncMastersData = async () => {
    await getMastersDataHandle({ flag: 2, id: 0 }); // ONLY DISTRICT
    await setSyncStatus(syncTaskName.syncMasters);
};

export const syncATPFormData = async (isSyncInProgress) => {
    console.log("Processing Queue...", isSyncInProgress);
    const queueProcessed = await processQueue(isSyncInProgress);

    if (queueProcessed === "EMPTY") {
        console.log("Queue empty → skipping queue sync");
    }
    await setSyncStatus(syncTaskName.syncAcitivityQueue);
}

export const syncPeerEducatorFormData = async(isSyncInProgress) => {
    await savePeerEducatorFormDatafromRedux(isSyncInProgress)
    await setSyncStatus(syncTaskName.syncPeerEducatorFormData);
}

