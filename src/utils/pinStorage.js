import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@admin_pin';
const DEFAULT_PIN = '1234';

export async function getAdminPin() {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return pin || DEFAULT_PIN;
}

export async function setAdminPin(newPin) {
  if (!/^\d{4,6}$/.test(newPin)) {
    throw new Error('PIN must be 4-6 digits');
  }
  await AsyncStorage.setItem(PIN_KEY, newPin);
}

export async function verifyAdminPin(attempt) {
  const stored = await getAdminPin();
  return attempt === stored;
}
