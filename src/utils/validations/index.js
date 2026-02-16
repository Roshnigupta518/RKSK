import moment from "moment";

export const isEmpty = (value) => {
  return !value || !value.toString().trim();
};

export const handleAPIErrorResponse = (response, caller) => {
  const { status, problem, data } = response;

  if (status === 200) {
    return;
  }

  if (status === 404) {
    throw `error in ${caller}: NOT FOUND`;
  }

  if (status === 500) {
    throw `error in ${caller}: SERVER ERROR`;
  }

  if (problem === 'CLIENT_ERROR') {
    throw `error in ${caller}: CLIENT_ERROR`;
  }
}

export const validateMobileNumber = (number) => {
  if (!number || number.trim() === '') {
    return 'Mobile number is required';
  }

  const regex = /^[6-9]\d{9}$/;
  if (!regex.test(number)) {
    return 'Please enter a valid 10-digit mobile number';
  }

  return null; // no error
};

export const dateFormat = (value) => {
  const date = moment(value).format('DD-MM-YYYY');
  return date;
}

export const TodayDate = () => {
  const date = moment().format('YYYY-MM-DD');
  return date;
}
