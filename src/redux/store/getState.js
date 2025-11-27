import { store } from ".";

export const isUserLoggedIn = () => {
    const loginData = store.getState().login?.data;
    // console.log('isUserLoggedIn', loginData, !!loginData);
    return !!loginData;
  };

  export const getSavedAtpListNotStarted = () => {
    console.log({getSavedAtpListNotStarted:isGetInProgress })
    let savedPATPData = store.getState().activityPlan?.data?.filter(res =>
      (res.status === ENUM.SERVERSTATUS.NOTSTARTED ||
       (isGetInProgress && res.status === ENUM.SERVERSTATUS.INPROGRESS)) 
    );

     function sortFunction(a, b) {
      var dateA = new Date(a.updatedDate).getTime();
      var dateB = new Date(b.updatedDate).getTime();
      return dateA < dateB ? 1 : -1;
    }
    let sortdata = savedPATPData?.sort(sortFunction);
    return sortdata;
  }