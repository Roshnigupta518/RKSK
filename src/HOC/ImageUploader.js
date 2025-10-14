import React, {useState} from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {request, PERMISSIONS} from 'react-native-permissions';
import Authbtn from '../components/customButton';
import Alert from '../components/alert';
import st from '../global/styles';
import { colors } from '../global';

/**
 * HOC: WithMediaUpload
 * Supports both image and video capture or selection.
 * @param {React.Component} WrappedComponent - Component that triggers upload modal
 * @param {Function} uploadFileToServer - callback for uploading media
 * @param {('image'|'video'|'both')} mediaType - what to allow (default: 'image')
 */
const WithMediaUpload = (WrappedComponent, uploadFileToServer, mediaType = 'image') => {
  return props => {
    const [showModal, setShowModal] = useState(false);

    // Max file sizes
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

    // ✅ Camera permission check
    const checkCameraPermission = async () => {
      try {
        if (Platform.OS === 'ios') {
          const result = await request(PERMISSIONS.IOS.CAMERA);
          return result === 'granted';
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'App Camera Permission',
              message: 'App needs access to your camera for capturing media.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    };

    // ✅ Storage permission check
    const checkStoragePermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to save your captured media.',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn(err);
          return false;
        }
      }
      return true;
    };

    // ✅ Open camera
    const handleCaptureMedia = async () => {
      const cameraGranted = await checkCameraPermission();
      const storageGranted = await checkStoragePermission();

      if (!cameraGranted || !storageGranted) {
        alert('Camera or storage permission denied.');
        return;
      }

      const options = {
        mediaType: mediaType === 'both' ? 'mixed' : mediaType,
        videoQuality: 'high',
        durationLimit: 30, // seconds for videos
        saveToPhotos: true,
      };

      launchCamera(options, res => {
        if (res.errorCode) {
          console.warn(res.errorCode);
          return;
        }

        if (!res.didCancel && res.assets && res.assets[0]) {
          const file = res.assets[0];
          if (!validateFileSize(file)) return;

          uploadFileToServer(res);
          setShowModal(false);
        }
      });
    };

    // ✅ Open gallery
    const handleChooseFromGallery = () => {
      const options = {
        mediaType: mediaType === 'both' ? 'mixed' : mediaType,
      };

      launchImageLibrary(options, res => {
        if (res.errorCode) {
          console.warn(res.errorCode);
          return;
        }

        if (!res.didCancel && res.assets && res.assets[0]) {
          const file = res.assets[0];
          if (!validateFileSize(file)) return;

          uploadFileToServer(res);
          setShowModal(false);
        }
      });
    };

    // ✅ Validate file size
    const validateFileSize = file => {
      const size = file.fileSize;
      const type = file.type;

      if (type.includes('image') && size > MAX_IMAGE_SIZE) {
        alert('Please select an image smaller than 2 MB.');
        return false;
      }
      if (type.includes('video') && size > MAX_VIDEO_SIZE) {
        alert('Please select a video smaller than 10 MB.');
        return false;
      }
      return true;
    };

    return (
      <View>
        <WrappedComponent
          {...props}
          handleMediaUpload={() => setShowModal(!showModal)}
        />
        <Alert showModal={showModal} setShowModal={setShowModal}>
          <View style={[st.pd20, st.align_C]}>
            <Text style={[st.tx16, st.mt_v]}>
              {mediaType === 'image'
                ? 'Upload Image'
                : mediaType === 'video'
                ? 'Upload Video'
                : 'Upload Image or Video'}
            </Text>

            <Authbtn title={'Capture from Camera'} onPress={handleCaptureMedia} />
            <Authbtn title={'Choose from Gallery'} onPress={handleChooseFromGallery} />
          </View>
        </Alert>
      </View>
    );
  };
};

export default WithMediaUpload;
