export const getPickerImageResp = res => {
    const respArr = res.assets;
    const imgResp = Array.isArray(respArr) && respArr.length ? respArr[0] : null;
  
    if (imgResp) {
      return {
        uri: imgResp?.uri,
        fileName: imgResp?.fileName,
        type: imgResp?.type,
      };
    }
  
    return false;
  };