import React, { useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  View,
  Text,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { request, PERMISSIONS } from 'react-native-permissions';
import Authbtn from '../components/customButton';
import Alert from '../components/alert';
import st from '../global/styles';
import { compressMedia } from '../components/compressMedia';

const WithMediaUpload = (WrappedComponent, mediaType = 'image') => {
  return props => {
    const [showModal, setShowModal] = useState(false);

    const {
      onUpload,   // ✅ PER ACTIVITY CALLBACK AAYEGA
      showGallery = false,
    } = props;

    // ✅ Camera permission
    const checkCameraPermission = async () => {
      try {
        if (Platform.OS === 'ios') {
          const result = await request(PERMISSIONS.IOS.CAMERA);
          return result === 'granted';
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        return false;
      }
    };

    const checkStoragePermission = async () => true;

    // ✅ CAPTURE FROM CAMERA
    // const handleCaptureMedia = async () => {
    //   const cameraGranted = await checkCameraPermission();
    //   const storageGranted = await checkStoragePermission();

    //   if (!cameraGranted || !storageGranted) {
    //     alert('Camera permission denied');
    //     return;
    //   }

    //   const options = {
    //     mediaType: mediaType === 'both' ? 'mixed' : mediaType,
    //     videoQuality: 'high',
    //     durationLimit: 30,
    //     saveToPhotos: false,
    //   };

    //   launchCamera(options, async res => {
    //     if (res?.assets?.[0]) {
    //       const file = res.assets[0];
    //       const compressedFile = await compressMedia(file);

    //       // ✅ ✅ ✅ PER ACTIVITY UPLOAD
    //       onUpload && onUpload(compressedFile);

    //       setShowModal(false);
    //     }
    //   });
    // };

    const handleCaptureMedia = async () => {
      try {
        const cameraGranted = await checkCameraPermission();
        const storageGranted = await checkStoragePermission();
    
        if (!cameraGranted || !storageGranted) {
          alert('Camera permission denied');
          return;
        }
    
        const options = {
          mediaType: mediaType === 'both' ? 'mixed' : mediaType,
          videoQuality: 'high',
          durationLimit: 30,
          saveToPhotos: false,
        };
    
        launchCamera(options, async res => {
          try {
            console.log('📸 Camera response:', res);
    
            // User cancelled camera
            if (res?.didCancel) {
              console.log('📸 User cancelled camera');
              return;
            }
    
            // Camera error
            if (res?.errorCode) {
              console.log('❌ Camera Error Code:', res.errorCode);
              console.log('❌ Camera Error Message:', res.errorMessage);
              return;
            }
    
            // No image returned
            if (!res?.assets?.[0]) {
              console.log('❌ No asset returned from camera');
              return;
            }
    
            const file = res.assets[0];
    
            console.log('📸 Captured file:', file);
            console.log('📸 File URI:', file.uri);
            console.log('📸 File Type:', file.type);
            console.log('📸 File Size:', file.fileSize);
    
            // Compression
            console.log('🔄 Starting compression...');
    
            const compressedFile = await compressMedia(file);
    
            console.log('✅ Compression completed:', compressedFile);
    
            // Upload callback
            onUpload && onUpload(compressedFile);
    
            setShowModal(false);
    
          } catch (error) {
            console.error('❌ Camera callback error:', error);
          }
        });
    
      } catch (error) {
        console.error('❌ handleCaptureMedia error:', error);
      }
    };

        // ✅ Open gallery
    const handleChooseFromGallery = async () => {
      const options = {
        // mediaType: mediaType === 'both' ? 'mixed' : mediaType,
        mediaType: 'photo', 
      };

      launchImageLibrary(options, async res => {
        if (res.errorCode) {
          console.warn(res.errorCode);
          return;
        }

        if (!res.didCancel && res.assets && res.assets[0]) {
          const file = res.assets[0];
          const compressedFile = await compressMedia(file);

          // ✅ ✅ ✅ PER ACTIVITY UPLOAD
          onUpload && onUpload(compressedFile);

          setShowModal(false);
        }
      });
    };

    return (
      <View>
        <WrappedComponent
          {...props}
          handleMediaUpload={() => setShowModal(true)}
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

            <Authbtn
              title={'Capture from Camera'}
              onPress={handleCaptureMedia}
            />
           {showGallery && (
            <Authbtn
              title={'Choose from Gallery'}
              onPress={handleChooseFromGallery}
            />
          )}
          </View>
        </Alert>
      </View>
    );
  };
};

export default WithMediaUpload;
