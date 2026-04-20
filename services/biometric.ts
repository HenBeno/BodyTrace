import * as LocalAuthentication from "expo-local-authentication";

export async function canUseBiometric(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  if (!has) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return r.success === true;
}
