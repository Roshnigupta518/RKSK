import { API } from "../endpoints";
import { getApi, postApi, postApiWithToken, uploadApi } from "../apicalls";
import { handleAPIErrorResponse } from "../validations";
import { store } from "../../redux/store";
import { setActivityPlan } from "../../redux/slices/ActivityPlan";
import { getSavedAtpListNotStarted } from "../../redux/store/getState";

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
        console.warn('Unexpected response:', result);
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

export const getDasboardDataHandle = async() => {

}

export const  getProfileDataHandle = async() => {

}

