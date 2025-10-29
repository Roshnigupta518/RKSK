// compressMedia.js
import { Image, Video } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';

export const compressMedia = async (file) => {
  const uri = file?.uri || file;
  const type = file?.type || '';

  try {
    if (type.startsWith('image/')) {
        Toast.show({
            type: 'info',
            text1: 'Compressing image...',
            position: 'bottom',
          });
    
      console.log('🖼️ Compressing image...');
      const compressedUri = await Image.compress(uri, {
        compressionMethod: 'auto',
        quality: 0.6,
        maxWidth: 1080,
        maxHeight: 1080,
      });

      const stat = await RNFS.stat(compressedUri);
      console.log(`✅ Image size: ${(stat.size / 1024).toFixed(1)} KB`);
      Toast.show({
        type: 'success',
        text1: 'Image compressed successfully!',
        position: 'bottom',
      });
      return { uri: compressedUri, type: 'image/jpeg', name: file?.fileName || 'image.jpg' };
    }

    if (type.startsWith('video/')) {
        Toast.show({
            type: 'info',
            text1: 'Compressing video...',
            position: 'bottom',
          });
      console.log('🎥 Compressing video...');
      const compressedUri = await Video.compress(
        uri,
        { 
            compressionMethod: 'auto', // 'auto', 'manual', 'medium', 'low'
            bitrate: 1000000, // ~1 Mbps target bitrate
            maxSize: 720, // scale down to 720p
         },
        (progress) => console.log(`Compression: ${Math.round(progress * 100)}%`)
      );

      const stat = await RNFS.stat(compressedUri);
      console.log(`✅ Video size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
      Toast.show({
        type: 'success',
        text1: 'Video compressed successfully!',
        position: 'bottom',
      });
      return { uri: compressedUri, type: 'video/mp4', name: file?.fileName || 'video.mp4' };
    }

    console.log('⚠️ Unsupported file type');
    return file;

  } catch (error) {
    console.error('Compression error:', error);
    return file;
  }
};
