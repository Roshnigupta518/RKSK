import { API } from "../endpoints";
import { getApi, postApi, postApiWithToken, uploadApi } from "../apicalls";
import { handleAPIErrorResponse } from "../validations";
import { store } from "../../redux/store";
import { setActivityPlan } from "../../redux/slices/ActivityPlan";
import { setPeerEducatorList } from "../../redux/slices/peerEducatorList";
import { setLocalMasters } from "../../redux/slices/Masters";
import { saveToLocal } from "./storage";

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



export const getDasboardDataHandle = async() => {

}

export const  getProfileDataHandle = async() => {

}

