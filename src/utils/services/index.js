import { API } from "../endpoints";
import { getApi, postApi, postApiWithToken, uploadApi } from "../apicalls";
import { handleAPIErrorResponse } from "../validations";
import { store } from "../../redux/store";
import { setActivityPlan } from "../../redux/slices/ActivityPlan";
import { setPeerEducatorList } from "../../redux/slices/peerEducatorList";
import { setLocalMasters } from "../../redux/slices/Masters";
import { saveToLocal } from "./storage";
import { incrementPeerRetryCount, removePeerReferralByClientId, setPeerReferralList, updateSavePeerReferralSyncStatus } from "../../redux/slices/ReferralList";
import { getSavedPeerEducatorNotStarted } from '../../redux/store/getState';
import { ENUM } from "../bgservices/enum";
import Toast from "react-native-toast-message";
import { syncTaskName } from "../../utils/bgservices/backgroundTaskEnum";
import { startBackgroundService } from '../bgservices/backgroundService' 

const getLoginDetails = () => {
    const loginData = store.getState().login?.data;
    return loginData;
}

export const getATPListRequest = async () => {
    const loginDetails = getLoginDetails()
    try {
      const url = `${API.GET_ATP}districtId=${loginDetails.districtId}&blockId=${loginDetails.blockId}&villageId=${0}&ashaFacilitatorId=${0}&trainerId=${loginDetails.trainerId}&IsMobileApp=1`;
      const result = await getApi(url);
      
      if (result?.status === 200) {
        store.dispatch(setActivityPlan(result.data))
      } else {
        console.warn('getATPListRequest Unexpected response:', result);
      }
    } catch (e) {
      handleAPIErrorResponse(e);
      return [];
    }
};
  
export const atpFormRequest = async (data) => {
  try {
    const url = `${API.ATP_POST}`;
    const result = await uploadApi(url, data);
    
    if (result?.status === 200) {
      return result.data; 
    } else {
      console.warn('Unexpected response:', result);
      throw new Error("Unexpected response");
    }
  } catch (e) {
    handleAPIErrorResponse(e);
    throw e; 
  }
};

export const activityLoginRequest = async (data) => {
  try {
    const url = `${API.Activity_Login}`;
    const result = await postApiWithToken(url, data);
    
    if (result?.status === 200) {
      return result.data; // return only the data
    } else {
      console.warn('Unexpected response:', result);
      throw new Error("Unexpected response");
    }
  } catch (e) {
    handleAPIErrorResponse(e);
    throw e;
  }
};

export const appUpdateRequest = async() =>{
  try {
    const url = `${API.GET_VERSION}`;
    const result = await getApi(url);
    
    if (result?.status === 200) {
      return result.data; 
    } else {
      console.warn('Unexpected response:', result);
      return [];
    }
  } catch (e) {
    handleAPIErrorResponse(e);
    return [];
  }
} 

export const getPeerEducatorListHandle = async() => {
  const loginDetails = getLoginDetails()
  if(loginDetails.role == 'Peer Educater'){
  try {
    const url = `${API.GET_PEEREDUCATOR_LIST}?id=${loginDetails.peerEducatorId}`;
    const result = await getApi(url);
    if (result?.status === 200) {
      store.dispatch(setPeerEducatorList(result.data))
    } else {
      console.warn('getPeerEducatorListHandle Unexpected response:', result);
    }
  } catch (e) {
    handleAPIErrorResponse(e);
    return [];
  }
}
}

export const getPeerEducatorReferralListHandle = async () => {
  try {
    const state = store.getState().peerReferralList;
    const localList = state.data || [];

    const url = `${API.GET_PEEREDUCATOR_REFERRAL_LIST}`;
    const result = await getApi(url);

    if (result?.status === 200) {
      const serverList = Array.isArray(result.data) ? result.data : [];

      const serverIds = new Set(serverList.map(i => i.clientId));

      // sirf unsynced local items rakho
      const offlineItems = localList.filter(item =>
        (item.syncStatus === ENUM.SERVERSTATUS.NOTSTARTED ||
         item.syncStatus === ENUM.SERVERSTATUS.FAILED ||
         item.syncStatus === ENUM.SERVERSTATUS.INPROGRESS) &&
        !serverIds.has(item.clientId)
      );

      const mergedList = [
        ...serverList.map(s => ({
          ...s,
          syncStatus: ENUM.SERVERSTATUS.COMPLETED,
          retryCount: 0,
        })),
        ...offlineItems,
      ];

      store.dispatch(setPeerReferralList(mergedList));
    }
  } catch (e) {
    handleAPIErrorResponse(e);
  }
};


const mapToPickerFormat = (arr = []) =>
  arr.map(item => ({
    label: item.name,
    value: String(item.id),
  }));

export const getMastersDataHandle = async ({ flag, id = 0, cluster = 0 }) => {
  try {
    const url = `${API.GET_MASTER}Flag=${flag}&Id=${id}&Cluster=${cluster}`;
    const result = await getApi(url);

    if (result?.status === 200 && Array.isArray(result?.data)) {
      const data = mapToPickerFormat(result.data);

      // 1️⃣ Save to local storage
      let storageKey = '';

      switch (flag) {
        case 2:
          storageKey = 'DISTRICT_LIST';
          break;
        case 3:
          storageKey = `BLOCK_${id}`;
          break;
        case 4:
          storageKey = `ASHA_SAHYOGI_${id}`;
          break;
        case 7:
          storageKey = `ASHA_${id}`;
          break;
        case 8:
          storageKey = `VILLAGE_${id}`;
          break;
        case 13:
          storageKey = `PEER_EDUCATOR_${id}`;
          break;
        case 14:
          storageKey = `PEER_EDUCATOR_GENDER_${id}`;
          break;
        default:
          break;
      }

      if (storageKey) {
        await saveToLocal(storageKey, data);
      }

      // 2️⃣ Update redux
      let type = '';

      switch (flag) {
        case 2:
          type = 'district';
          break;
        case 3:
          type = 'block';
          break;
        case 4:
          type = 'ashaSahyogi';
          break;
        case 7:
          type = 'asha';
          break;
        case 8:
          type = 'village';
          break;
        case 13:
          type = 'peerEducator';
          break;
        case 14:
          type = 'peerEducatorGender';
          break;
        default:
          break;
      }

      if (type) {
        store.dispatch(
          setLocalMasters({
            type,
            id,
            data,
          })
        );
      }

      return data;
    }

    console.warn('Unexpected response:', result);
    return [];
  } catch (e) {
    handleAPIErrorResponse(e);
    return [];
  }
};

export const savePeerEducatorFormDatafromRedux = async isSyncInProgrss => {
  const getSavedPeerEducatorlistStarted =
  getSavedPeerEducatorNotStarted(isSyncInProgrss);

  for (let i = 0; i < getSavedPeerEducatorlistStarted?.length; i++) {
    await saveSinglePeerEducatorList(getSavedPeerEducatorlistStarted[i]);
  }
};

export const saveSinglePeerEducatorList = async (data) => {
  const loginDetails = getLoginDetails()

  const MAX_RETRY = 3;

  const currentRetry = data?.retryCount || 0;

  if (currentRetry >= MAX_RETRY) {
    console.warn('Max retry reached. Removing from list:', data.clientId);
    store.dispatch(removePeerReferralByClientId({ clientId: data.clientId }));
    return;
  }

  store.dispatch(updateSavePeerReferralSyncStatus({
    syncStatus: ENUM.SERVERSTATUS.INPROGRESS,
    clientId: data.clientId,
  }));

  const url = `${API.SAVE_PEEREDICATOR_REFERRAL}`;
  const formData = new FormData();
  formData.append('DistrictId', data.district);
  formData.append('BlockId', data.block);
  formData.append('VillageId', data.village);
  formData.append('AshaFacilitatorId', data.supervisorName);
  formData.append('AshaId', data.ashaName);
  formData.append('sathiyaName', data.sathiyaName);
  formData.append('gender', data.gender);
  formData.append('activityDate', data.activityDate);
  formData.append('location', data.locationText);
  formData.append('activityType', data.activityTypeText);
  formData.append('module', data.moduleText);
  formData.append('comicBook', data.comicBookText);
  formData.append('activityMethod', data.activityMethodText);
  formData.append('Participants', JSON.stringify(data.participants));
  formData.append('duration', data.duration);
  formData.append('materialUsed', data.materialUsedText);
  formData.append('questions', data.questions);
  formData.append('challenges', data.challenges);
  formData.append('successStory', data.successStory);
  formData.append('createby', loginDetails.userId);
  formData.append('Boys_Girls_Reffered_Health_Treatment', data.refer);
  formData.append('referralsJson', JSON.stringify(data.referrals));
  formData.append('SyncStatus', data.syncStatus);
  formData.append('ClientId', data.clientId);
  formData.append('IP', data.IP);
  formData.append('Referrals', '')
  {
    data?.attachment?.map((i) => {
      formData.append('Photo', i);
    })
  }
  formData.append('PhotoFilePath', '');
  formData.append('SupervisorName',data.supervisorName)
  
  try {
    const result = await uploadApi(url, formData);
    if (result.status === 200) {
      store.dispatch(updateSavePeerReferralSyncStatus({
        syncStatus: ENUM.SERVERSTATUS.COMPLETED,
        clientId: data.clientId,
      }));
     
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: "Data Saved successfully",
      });

      // startBackgroundService(syncTaskName.syncPeerEducatorReferralList)
    }
  } catch (e) {
    store.dispatch(incrementPeerRetryCount({ clientId: data.clientId }));

    const updatedItem = store.getState().peerReferralList.data.find(i => i.clientId === data.clientId);

    if ((updatedItem?.retryCount || 0) >= MAX_RETRY) {
      console.warn('Retry failed 3 times. Removing item:', data.clientId);
      store.dispatch(removePeerReferralByClientId({ clientId: data.clientId }));
    } else {
      store.dispatch(updateSavePeerReferralSyncStatus({
        syncStatus: ENUM.SERVERSTATUS.FAILED,
        clientId: data.clientId,
      }));
    }

    handleAPIErrorResponse(e, 'save peer educator form data catch');
  }
};

export const getDasboardDataHandle = async() => {

}

export const  getProfileDataHandle = async() => {

}

