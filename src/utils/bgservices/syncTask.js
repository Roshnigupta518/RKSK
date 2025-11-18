import { syncTaskName } from "./backgroundTaskEnum";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDasboardDataHandle, getProfileDataHandle, getATPListRequest } from "../services";

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

export const syncATPFormData = async () => {
    saveATPForm();
    await setSyncStatus(syncTaskName.syncActivityForm);
};

