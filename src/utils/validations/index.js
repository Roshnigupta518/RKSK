import moment from "moment";
import { Alert } from "react-native";

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

export const validateByRegex = (value, regexConfig, fieldName, tempErrors) => {
  if (!value || value.trim().length === 0) {
    tempErrors[fieldName] = regexConfig.emptyError;
    return false;
  }

  if (!regexConfig.regex.test(value.trim())) {
    tempErrors[fieldName] = regexConfig.typeError;
    return false;
  }

  return true;
};


export const validateLocationBeforeSubmit = ({
  location,
  error,
  getLocation,
  openLocationSettings,
  permissionHandle,
}) => {

  if (!location) {

    if (error === 'gps-off') {
      Alert.alert(
        'Location Required',
        'Location permission is required to submit the form. Please enable location access in your device settings.',
        [
          {
            text: 'OK',
            onPress: () => openLocationSettings(),
          },
        ]
      );
    } 
    else if (error === 'permissionDenied') {
      permissionHandle();
    } 
    else {
      Alert.alert(
        'Location Not Captured',
        'We could not detect your location. Please try again after moving to an open area.'
      );
    }

    getLocation(); // retry location
    return false;
  }

  return true;
};
