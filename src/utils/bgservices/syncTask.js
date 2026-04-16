import { syncTaskName } from "./backgroundTaskEnum";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDasboardDataHandle, getProfileDataHandle, getATPListRequest, getPeerEducatorListHandle, getMastersDataHandle, getPeerEducatorReferralListHandle, getPeerReportingCount, savePeerBridageFormDatafromRedux, getPeerBridageListHandle } from "../services";
import { processQueue } from "./queueProcessor";
import { savePeerEducatorFormDatafromRedux, getIecMaterialListHandle, getAwarenessVideoListHandle, getProfileHandle, saveReferralFormDatafromRedux, getIndividualReferralListHandle } from "../services";

const setSyncStatus = async taskName => {
    const status = { lastSyncOn: new Date() };
    await AsyncStorage.setItem(taskName + 'Status', JSON.stringify(status));
};

export const syncDashboard = async () => {
    getDasboardDataHandle();
    await setSyncStatus(syncTaskName.syncDashboard);
};

export const syncPeerReportingCount = async() => {
    getPeerReportingCount()
    await setSyncStatus(syncTaskName.syncPeerReportingCount)
}

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

export const syncPeerBrigadeList = async () => {
    getPeerBridageListHandle();
    await setSyncStatus(syncTaskName.syncPeerBrigadeList);
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

export const syncPeerBrigadeFormData = async(isSyncInProgress) => {
    await savePeerBridageFormDatafromRedux(isSyncInProgress)
    await setSyncStatus(syncTaskName.syncPeerBrigadeForm);
}

export const syncIecMaterailList = async () => {
    getIecMaterialListHandle();
    await setSyncStatus(syncTaskName.syncIecMaterialList);
};

export const syncAwarenessVideoList = async () => {
    getAwarenessVideoListHandle();
    await setSyncStatus(syncTaskName.syncAwarenessVideo);
};

export const syncProfileHandle = async () => {
    getProfileHandle();
    await setSyncStatus(syncTaskName.syncGetProfile);
};

export const syncReferralFormData = async(isSyncInProgress) => {
    await saveReferralFormDatafromRedux(isSyncInProgress)
    await setSyncStatus(syncTaskName.syncReferralForm);
}

export const syncIndividualReferralList = async () => {
    getIndividualReferralListHandle();
    await setSyncStatus(syncTaskName.syncIndividualReferralList);
};

