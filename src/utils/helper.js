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

  // Function to get the formatted date
export const formatDate = date => {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let day = date.getDate();
  let month = months[date.getMonth()];
  let year = date.getFullYear();
  let dayOfWeek = daysOfWeek[date.getDay()];

  return `${day} ${month} ${year}, ${dayOfWeek}`;
};

export const formatTime = mydate => {
  let date;
  date = mydate ? new Date(mydate) : new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  let formattedTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
  return formattedTime;
};