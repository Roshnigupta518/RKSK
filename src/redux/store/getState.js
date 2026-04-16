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
  

  export const getSavedPeerBridageNotStarted = (isGetInProgress) => {
    const data = store.getState().peerBrigadeList?.data
    let savedPeerBrigadeData = data
      ?.filter(res =>
        res.syncStatus === ENUM.SERVERSTATUS.NOTSTARTED ||
        res.syncStatus === ENUM.SERVERSTATUS.FAILED ||   
        (isGetInProgress && res.syncStatus === ENUM.SERVERSTATUS.INPROGRESS)
      );
  
    savedPeerBrigadeData?.sort((a, b) => {
      const dateA = new Date(a.createdOn).getTime();
      const dateB = new Date(b.createdOn).getTime();
      return dateA < dateB ? 1 : -1;
    });

    console.log({data, savedPeerBrigadeData, isGetInProgress})
  
    return savedPeerBrigadeData;
  };

  export const getSavedReferralNotStarted = (isGetInProgress) => {
    const data = store.getState().ReferralList?.data
    console.log({getSavedReferralNotStarted: data})
    let savedReferralData = data
      ?.filter(res =>
        res.syncStatus === ENUM.SERVERSTATUS.NOTSTARTED ||
        res.syncStatus === ENUM.SERVERSTATUS.FAILED ||   // include failed
        (isGetInProgress && res.syncStatus === ENUM.SERVERSTATUS.INPROGRESS)
      );
  
    savedReferralData?.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA < dateB ? 1 : -1;
    });

    console.log({data, savedReferralData, isGetInProgress})
  
    return savedReferralData;
  };