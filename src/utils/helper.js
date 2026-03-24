import { ENUM } from "./bgservices/enum";
import { colors } from "../global";
import { PermissionsAndroid, Platform, Alert } from "react-native";
import ReactNativeBlobUtil from 'react-native-blob-util';

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

export const formatClockInDisplay = (clockinTime) => {
  if (!clockinTime) return "-";

  const date = new Date(clockinTime);
  if (isNaN(date)) return "-";

  const now = new Date();

  // TODAY check
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // YESTERDAY check
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const formatted = formatISTDate(date);

  if (isToday) {
    // only time
    return formatted.time12;
  }

  if (isYesterday) {
    // Yesterday + time
    return `Yesterday, ${formatted.time12}`;
  }

  // old date → full date + time
  return `${formatted.fullDate} ${formatted.time12}`;
};

export const formatISTDate = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");

  return {
    fullDate: `${dd}-${mm}-${yyyy}`,
    time12: `${hh}:${minutes}:${seconds} ${ampm}`,
  };
};

export const formatFullDateTime = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");

  return {
    fullDate: `${dd}-${mm}-${yyyy}\n`,
    time12: `${hh}:${minutes}:${seconds} ${ampm}`
  };
};

export const parseAnyDate = (dateStr) => {
  if (!dateStr) return null;

  // 1) If ISO → return directly
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  }

  // 2) If DD-MM-YYYY HH:mm:ss
  const [datePart, timePart] = dateStr.split(" ");
  const [dd, mm, yyyy] = datePart.split("-");

  return new Date(`${yyyy}-${mm}-${dd}T${timePart || "00:00:00"}`);
};

export const convertToISODate = (dateString) => {
  if (!dateString) return "";

  const [datePart] = dateString.split(" ");
  const [dd, mm, yyyy] = datePart.split("-");

  return `${yyyy}-${mm}-${dd}`;
};

export const convertToLabelValue = (arr, labelKey, valueKey) => {
  return (arr || []).map(item => ({
    label: item[labelKey] || '',
    value: item[valueKey] || null,
    ...item
  }));
};

export const timeDifferenceFun = (clockin, clockout) => {
  const start = new Date(clockin);
  const end = clockout ? new Date(clockout) : new Date(); // if not clocked out → now

  let diffMs = end - start;
  if (diffMs < 0) diffMs = 0;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

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

export const getPlanStatus = (item) => {
  // ✅ Local Date (NOT UTC)
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // ✅ API Date: "30-10-2025 15:30:00"
  if (!item?.visit_Start_Date) return "Pending";

  const [datePart] = item.visit_Start_Date.split(" ");
  const [day, month, year] = datePart.split("-");

  const visit = new Date(year, month - 1, day);

  // ✅ Status Priority (Correct Order)
  if (item.clockoutTime) return "Completed";
  if (item.clockinTime) return "In Progress";

  if (visit.getTime() === today.getTime()) return "Pending";
  if (visit > today) return "Scheduled";
  if (visit < today) return "Overdue";

  return "Pending";
};

export const calculateDashboardCounts = (activityList = []) => {
  const uniqueList = Object.values(
    activityList.reduce((acc, item) => {
      acc[item.atP_Id] = item;
      return acc;
    }, {})
  );

  let completedThisMonth = 0;
  let scheduledToday = 0;
  let overdue = 0;
  let onSchedule = 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  uniqueList.forEach(item => {
    const status = getPlanStatus(item);

    // -------- Get Activity Date Safely --------
    const activityDate = parseDDMMYYYY(item.visit_Start_Date);
    if (!activityDate) return;

    const onlyDate = new Date(activityDate);
    onlyDate.setHours(0, 0, 0, 0);

    // ------------------------------
    // 1️⃣ COMPLETED THIS MONTH
    // ------------------------------
    if (status === "Completed" && item.clockoutTime) {
      const completedDate = new Date(item.clockoutTime);
      if (
        completedDate.getMonth() === currentMonth &&
        completedDate.getFullYear() === currentYear
      ) {
        completedThisMonth++;
      }
    }

    // ------------------------------
    // 2️⃣ SCHEDULED TODAY (Pending + Today InProgress)
    // ------------------------------
    if (
      (status === "Pending") ||
      (status === "In Progress" && onlyDate.getTime() === now.getTime())
    ) {
      scheduledToday++;
    }

    // ------------------------------
    // 3️⃣ OVERDUE (Overdue + Past InProgress)
    // ------------------------------
    if (
      status === "Overdue" ||
      (status === "In Progress" && onlyDate.getTime() < now.getTime())
    ) {
      overdue++;
    }

    // ------------------------------
    // 4️⃣ ON SCHEDULE (Future Scheduled + Future InProgress)
    // ------------------------------
    if (
      status === "Scheduled" ||
      (status === "In Progress" && onlyDate.getTime() > now.getTime())
    ) {
      onSchedule++;
    }
  });

  return {
    completedThisMonth,
    scheduledToday,
    overdue,
    onSchedule,
  };
};

export const parseDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;

  const [datePart, timePart] = dateStr.split(" ");
  const [dd, mm, yyyy] = datePart.split("-").map(Number);
  const [hh = 0, min = 0, sec = 0] = timePart ? timePart.split(":").map(Number) : [];

  return new Date(yyyy, mm - 1, dd, hh, min, sec);
};

export const getSyncUI = (status) => {
  switch (status) {
    case ENUM.SERVERSTATUS.COMPLETED:
      return { text: "✔", color: colors.green };

    case ENUM.SERVERSTATUS.FAILED:
      return { text: "✖", color: colors.red };

    case ENUM.SERVERSTATUS.PENDING:
    default:
      return { text: "⟳", color: colors.orange };
  }
};

export const showIconName = (status) => {
  if (status == ENUM.SERVERSTATUS.COMPLETED ) {
    return 'check'
  } else if (status == ENUM.SERVERSTATUS.INPROGRESS || status == ENUM.SERVERSTATUS.NOTSTARTED) {
    return 'clock'
  } else if (status == ENUM.SERVERSTATUS.FAILED ) {
    return 'x'
  } else {
    return ''
  }
}

export const showIconColor = (status) => {
  if (status == ENUM.SERVERSTATUS.COMPLETED || status == 1) {
    return colors.blue
  } else if (status == ENUM.SERVERSTATUS.FAILED || status == 0) {
    return colors.red
  } else {
    return colors.grey
  }
}


// export const getLabelsFromValues = (values = [], items = []) => {
//   if (!Array.isArray(values)) values = [values];

//   return values
//     .map(val => items.find(i => String(i.value) === String(val))?.label)
//     .filter(Boolean);
// };


export const getLabelsFromValues = (values = [], items = []) => {
  if (!Array.isArray(values)) values = [values];

  return values
    .map(val => {
      const strVal = String(val).toLowerCase();

      const found = items.find(i => {
        const valueKey = i.value ?? i.id;
        const labelKey = i.label ?? i.name;

        return (
          String(valueKey).toLowerCase() === strVal ||
          String(labelKey).toLowerCase() === strVal
        );
      });

      if (found) {
        return found.label ?? found.name;
      }

      // fallback → raw value
      return String(val);
    })
    .filter(Boolean);
};

export const downloadFile = async (title, url) => {
  const androidVersion =
    Platform.OS === 'android' ? parseInt(Platform.Version, 10) : 0;

  try {
    if (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && androidVersion >= 13)
    ) {
      // iOS and Android 13+ (No explicit permission needed)
      return await initiateDownload(title, url);
    } else {
      // Android < 13 (Permission required)
      const permissionGranted = await requestStoragePermission(t);
      if (permissionGranted) {
        return await initiateDownload(title, url);
      } else {
        Alert.alert(('Alert'), ('Permission Denied'), [{text: 'OK'}]);
        throw new Error('Storage permission denied');
      }
    }
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

// Request storage permission for Android < 13
const requestStoragePermission = async t => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Mannhitexternalstorage',
        buttonNeutral: 'AskLater',
        buttonNegative: 'Cancel',
        buttonPositive: 'Yes',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting permission:', error);
    throw error;
  }
};

// Handle the actual file download
const initiateDownload = async (title, url) => {
  try {
    const date = new Date();
    const {dirs} = ReactNativeBlobUtil.fs;

    // Define the download path
    // const path = `${dirs.DownloadDir}/${title}-${date.getTime()}.pdf`;

    const fileName = `${title}-${Math.floor(
      date.getTime() + date.getSeconds() / 2,
    )}.pdf`;
    // const filePath = `${dirs.DownloadDir}/${fileName}`;
    const filePath = `/storage/emulated/0/Download/${fileName}`;

    console.log('Download path resolved:', filePath);

    // Configure download options
    const options = {
      fileCache: true,
      trusty: true, 
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        mediaScannable: true,
        title: title,
        mime: 'application/pdf',
        appendExt: 'pdf',
        description: title,
        path: filePath,
      },
    };

    console.log('Download options:', options);

    // Download the file
    const res = await ReactNativeBlobUtil.config(options).fetch('GET', url);

    console.log('PDF downloaded successfully:', res.path());

    // Trigger media scan to make the file visible
    await ReactNativeBlobUtil.fs.scanFile([
      {path: res.path(), mime: 'application/pdf'},
    ]);
    console.log('Media scan triggered');

    return res.path(); // Return the path of the downloaded file
  } catch (error) {
    console.error('Error during file download:', error);
    throw error;
  }
};


