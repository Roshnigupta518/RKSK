import { store } from ".";
import { ENUM } from "../../utils/bgservices/enum";
export const isUserLoggedIn = () => {
    const loginData = store.getState().login?.data;
    return !!loginData;
  };

  export const getSavedPeerEducatorNotStarted = (isGetInProgress) => {
    const data = store.getState().peerReferralList?.data
    let savedPeerEducatorData = data
      ?.filter(res =>
        res.syncStatus === ENUM.SERVERSTATUS.NOTSTARTED ||
        res.syncStatus === ENUM.SERVERSTATUS.FAILED ||   // include failed
        (isGetInProgress && res.syncStatus === ENUM.SERVERSTATUS.INPROGRESS)
      );
  
    savedPeerEducatorData?.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA < dateB ? 1 : -1;
    });

    console.log({data, savedPeerEducatorData, isGetInProgress})
  
    return savedPeerEducatorData;
  };
  