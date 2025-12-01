//permission handling
// utils/permissionUtils.js
//Code was updated from barscanner which was deprecated.
import * as Camera from 'expo-camera';

/**
 * Request camera permission from the user
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestCameraPermission() {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}
