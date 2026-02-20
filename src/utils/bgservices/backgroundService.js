import BackgroundService from 'react-native-background-actions';
import {syncTaskName} from './backgroundTaskEnum';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { isUserLoggedIn } from '../../redux/store/getState';
import {  syncATPListData, syncDashboard, syncProfileData, syncATPFormData, syncATPFormClockOut, syncATPFormClockIn,syncPeerEducatorFormData, syncPeerEducatorList, syncMastersData, syncPeerEducatorReferralList, syncPeerReportingCount } from './syncTask';
import { processQueue } from './queueProcessor';

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));
const defaultDelay = 1 * 60 * 1000;
const isNotToday = date => {
  const today = new Date();
  const iDate = new Date(date);

  return (
    iDate.getDate() !== today.getDate() ||
    iDate.getMonth() !== today.getMonth() ||
    iDate.getFullYear() !== today.getFullYear()
  );
};

const checkIfTaskNotSyncedToday = async taskName => {
    let taskNameStatus = await AsyncStorage.getItem(taskName + 'Status');
    taskNameStatus = JSON.parse(taskNameStatus);
    console.log(
      'taskNameStatus?.lastSyncOn',
      taskNameStatus?.lastSyncOn,
      taskName,
    );
  
    if (!taskNameStatus?.lastSyncOn) return true;
    else return isNotToday(taskNameStatus?.lastSyncOn);
  };

  const checkIfSyncPending = async () => {
    const isSyncAcitivityQueue = await checkIfTaskNotSyncedToday(
      syncTaskName.syncAcitivityQueue,
    );

    const isSyncPeerEducatorFormData = await checkIfTaskNotSyncedToday(
      syncTaskName.syncPeerEducatorFormData,
    );

    const isSyncPending = isSyncAcitivityQueue || isSyncPeerEducatorFormData
    
    return isSyncPending
  };

  const executeTask = async taskDataArguments => {
    console.log({ taskDataArguments });
    const { taskName } = taskDataArguments;
    const syncAll = taskName === syncTaskName.all;
  
    console.log('executeTask Invoked: taskName ' + (taskName || 'ALL'));
  
    await new Promise(async resolve => {
      let isAnythingPendingForSync = false;
      while (await BackgroundService.isRunning()) {
        await sleep(1000); // prevent tight loop
  
        if (!isUserLoggedIn()) {
          console.log('Exit background service as user is not logged in');
          await stopAllBackgroundServices();
          resolve();
          break;
        }
  
        const netInfoState = await NetInfo.fetch();
        if (netInfoState.isConnected) {
          try {
            // let isSyncDashboard = taskName == syncTaskName.syncDashboard || syncAll;
            // let isSyncProfile = taskName == syncTaskName.syncGetProfile || syncAll;
            let isSyncPeerCount = taskName == syncTaskName.syncPeerReportingCount || syncAll;
            let isSyncATPList = taskName == syncTaskName.syncGetAtpList || syncAll;
            let isSyncActivityQueue = taskName == syncTaskName.syncAcitivityQueue || syncAll;
            let isSyncPeerEducatorList = taskName == syncTaskName.syncPeerEducatorList || syncAll;
            let isSyncPeerReferralList = taskName == syncTaskName.syncPeerEducatorReferralList || syncAll;
            let isSyncMasters = taskName == syncTaskName.syncMasters || syncAll;
            let isSyncPeerEducatorFormData = taskName == syncTaskName.syncPeerEducatorFormData || syncAll;
             

            if (isAnythingPendingForSync) {
              isSyncActivityQueue = await checkIfTaskNotSyncedToday(
                syncTaskName.syncAcitivityQueue
              );

              isSyncPeerEducatorFormData = await checkIfTaskNotSyncedToday(
                syncTaskName.syncPeerEducatorFormData
              )
            }
             
            // if (isSyncDashboard) {
            //   console.log('executing sync dashboard');
            //   await syncDashboard();
            // }

            // if (isSyncProfile) {
            //   console.log('executing sync isSyncProfile');
            //   await syncProfileData();
            // }

            if(isSyncPeerCount){
              console.log('executing sync isSyncPeerCount')
              await syncPeerReportingCount()
            }

            if(isSyncMasters) {
              console.log('executing sync isSyncMasters');
              await syncMastersData()
            }

            if (isSyncATPList) {
              console.log('executing sync isSyncATPList');
              await syncATPListData();
            }

            if(isSyncPeerEducatorList){
              console.log("Processing Queue...");
              await syncPeerEducatorList();
            }

            if(isSyncPeerReferralList) {
              console.log("peer educator referral list...");
              await syncPeerEducatorReferralList()
            }

            if (isSyncActivityQueue) {
              const isSyncInProgress =
              taskName == syncTaskName.syncAcitivityQueue || isAnythingPendingForSync;
              console.log('excuting acitivty queue', isSyncInProgress)

              console.log('executing sync isSyncActivityQueue');
              await updateSyncNotification("Syncing atp atp form data...");
              await syncATPFormData(isSyncInProgress)
              console.log('completed sync isSyncActivityQueue');
            }

            if(isSyncPeerEducatorFormData){
              const isSyncInProgress = taskName == syncTaskName.syncPeerEducatorFormData || isAnythingPendingForSync;
              console.log('excuting isSyncPeerEducatorFormData', isSyncInProgress)
              await updateSyncNotification("Syncing atp peer educator form data...");
              await syncPeerEducatorFormData(isSyncInProgress)
              console.log('completed sync isSyncPeerEducatorFormData');
            }

            if (await checkIfSyncPending()) {
              console.log('sync pending--------------');
              isAnythingPendingForSync = true;
              await sleep(defaultDelay);
            } else {
              isAnythingPendingForSync = false;
              console.log('sync completed');
              await updateSyncNotification("Data sync completed ✅");
              await stopAllBackgroundServices();
              resolve();
            }
          } catch (err) {
            console.log('Error:', err);
            await stopAllBackgroundServices();
            resolve();
          }
        } else {
          console.log('Internet not available');
          await sleep(defaultDelay);
        }
      }
    });
  };

  export const updateSyncNotification = async (message) => {
    if (await BackgroundService.isRunning()) {
      await BackgroundService.updateNotification({
        taskTitle: "RKSK MP App",
        taskDesc: message,
      });
    } else {
      console.log("⚠️ Tried to update notification but service not running");
    }
  };
  

  const startBackgroundService = async taskName => {
    console.log('startBackgroundService Invoked: taks ' + taskName);
    if (!isUserLoggedIn()) {
        console.log('Do not start background service as user is not logged in');
        stopAllBackgroundServices();
        return;
    }

    const options = {
        taskName: 'RKSK MP',
        taskTitle: 'RKSK MP application background sync process',
        taskDesc: 'Syncing data with server…',
        taskIcon: {
            name: 'ic_launcher',
            type: 'mipmap',
        },
        color: '#ff00ff',
        //  linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
        parameters: {
            taskName: taskName,
        },
    };
    console.log('BackgroundService.isRunning()', BackgroundService.isRunning());
    if (!BackgroundService.isRunning()) {
        console.log('Starting the background service: task', options);
        await BackgroundService.start(executeTask, options);
        console.log('Background service started successfully!');
    }
};

const stopAllBackgroundServices = async () => {
    console.log('stopAllBackgroundServices Invoked');
    await BackgroundService.stop();
};

 const reStartBackgroundService = async (taskName) => {
  console.log('reStartBackgroundService invoked');
  await stopAllBackgroundServices();
  return await startBackgroundService(taskName); // ✅ return
};


const IsBackgroundSyncRunning = () => {
    console.log('BackgroundService.isRunning()', BackgroundService.isRunning());
    return BackgroundService.isRunning();
};

export {
    startBackgroundService,
    stopAllBackgroundServices,
    reStartBackgroundService,
    IsBackgroundSyncRunning,
};
