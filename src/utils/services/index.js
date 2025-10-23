import { API } from "../endpoints";
import { getApi } from "../apicalls";
import { handleAPIErrorResponse } from "../validations";
import { store } from "../../redux/store";

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
        return result.data; // return only the data
      } else {
        console.warn('Unexpected response:', result);
        return [];
      }
    } catch (e) {
      handleAPIErrorResponse(e);
      return [];
    }
};
  
