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

// export const calculateDashboardCounts = (activityList = []) => {
//   // -------------------------------------
//   // STEP 1: Make list UNIQUE by atP_Id
//   // -------------------------------------
//   const uniqueList = Object.values(
//     activityList.reduce((acc, item) => {
//       acc[item.atP_Id] = item; // override to keep last/latest
//       return acc;
//     }, {})
//   );

//   let completedThisMonth = 0;
//   let scheduledToday = 0;
//   let overdue = 0;
//   let onSchedule = 0;

//   const now = new Date();
//   const currentMonth = now.getMonth();
//   const currentYear = now.getFullYear();

//   uniqueList.forEach(item => {
//     const status = getPlanStatus(item);

//     // COMPLETED THIS MONTH
//     if (status === "Completed" && item.clockoutTime) {
//       const completedDate = new Date(item.clockoutTime);

//       if (
//         completedDate.getMonth() === currentMonth &&
//         completedDate.getFullYear() === currentYear
//       ) {
//         completedThisMonth++;
//       }
//     }

//     // SCHEDULED TODAY
//     if (status === "Pending") {
//       const [datePart] = item.visit_Start_Date.split(" ");
//       const [day, month, year] = datePart.split("-");
//       const visitDate = new Date(year, month - 1, day);

//       if (
//         visitDate.getDate() === now.getDate() &&
//         visitDate.getMonth() === now.getMonth() &&
//         visitDate.getFullYear() === now.getFullYear()
//       ) {
//         scheduledToday++;
//       }
//     }

//     // OVERDUE
//     if (status === "Overdue") overdue++;

//     // ON SCHEDULE
//     if (status === "Scheduled") onSchedule++;
//   });

//   return {
//     completedThisMonth,
//     scheduledToday,
//     overdue,
//     onSchedule,
//   };
// };

export const calculateDashboardCounts = (activityList = []) => {
  // STEP 1 → MAKE UNIQUE LIST
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
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  uniqueList.forEach(item => {
    const status = getPlanStatus(item);

    // 1️⃣ COMPLETED THIS MONTH
    if (status === "Completed" && item.clockoutTime) {
      const completedDate = new Date(item.clockoutTime);
      if (
        completedDate.getMonth() === currentMonth &&
        completedDate.getFullYear() === currentYear
      ) {
        completedThisMonth++;
      }
    }

    // 2️⃣ SCHEDULED TODAY  (Pending + InProgress)
    if (status === "Pending" || status === "In Progress") {
      if (item.visit_Start_Date) {
        const [datePart] = item.visit_Start_Date.split(" ");
        const [day, month, year] = datePart.split("-");
        const visitDate = new Date(year, month - 1, day);

        if (
          visitDate.getDate() === now.getDate() &&
          visitDate.getMonth() === now.getMonth() &&
          visitDate.getFullYear() === now.getFullYear()
        ) {
          scheduledToday++;
        }
      }
    }

    // 3️⃣ OVERDUE  (Overdue + InProgress)
    if (status === "Overdue" || status === "In Progress") {
      overdue++;
    }

    // 4️⃣ ON SCHEDULE  (Scheduled + InProgress)
    if (status === "Scheduled") {
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
