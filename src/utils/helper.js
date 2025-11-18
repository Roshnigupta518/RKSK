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

export const convertToLabelValue = (arr, labelKey, valueKey) => {
  return (arr || []).map(item => ({
    label: item[labelKey] || '',
    value: item[valueKey] || null,
    ...item
  }));
};

export function timeDifferenceFun(storedTime, logoutTime) {
  // console.log({storedTime, logoutTime});
  let currentTime = (logoutTime && new Date(logoutTime)) || new Date();
  let timeDiff = currentTime - storedTime; // Difference in milliseconds

  // Convert milliseconds to different time units
  let seconds = Math.floor((timeDiff / 1000) % 60)
    .toString()
    .padStart(2, '0');
  let minutes = Math.floor((timeDiff / (1000 * 60)) % 60)
    .toString()
    .padStart(2, '0');
  let hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
  let days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  // console.log(`Difference:
  //   ${days} days,
  //   ${hours} hours,
  //   ${minutes} minutes,
  //   ${seconds} seconds.`);

  return hours + ':' + minutes + ':' + seconds;
}

export const generateclientID = userId => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const randomTwoDigit = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${userId}_${year}${month}${day}_${hours}${minutes}${seconds}_${randomTwoDigit}`;
};

