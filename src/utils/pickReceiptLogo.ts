import { PermissionsAndroid, Platform } from 'react-native';
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';

async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      {
        title: 'Photo access',
        message: 'Allow access to choose a receipt logo from your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.Version >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Photo access',
        message: 'Allow access to choose a receipt logo from your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return true;
}

const pickFromResponse = (response: ImagePickerResponse): string | null => {
  if (response.didCancel || response.errorCode) {
    return null;
  }
  const uri = response.assets?.[0]?.uri;
  return uri ?? null;
};

export const pickReceiptLogoFromGallery = async (): Promise<string | null> => {
  const allowed = await requestGalleryPermission();
  if (!allowed) {
    throw new Error('Photo permission denied. Allow gallery access in Android settings.');
  }

  const response = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 1,
    maxWidth: 576,
    maxHeight: 288,
  });

  return pickFromResponse(response);
};
