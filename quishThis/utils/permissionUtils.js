//permission handling
// utils/permissionUtils.js
import { BarCodeScanner } from 'expo-barcode-scanner';

/**
* Request camera permission from the user
* @returns {Promise<boolean>} - Whether permission was granted
*/
export async function requestCameraPermission() {
try {
const { status } = await BarCodeScanner.requestPermissionsAsync();
return status === 'granted';
} catch (error) {
console.error('Error requesting camera permission:', error);
return false;
}
}