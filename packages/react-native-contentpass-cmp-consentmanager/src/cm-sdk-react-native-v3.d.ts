declare module 'cm-sdk-react-native-v3' {
  export interface UserStatus {
    status: string;
    vendors: Record<string, string>;
    purposes: Record<string, string>;
    tcf: string;
    addtlConsent: string;
    regulation: string;
  }

  export interface CmSdkReactNativeV3Module {
    checkAndOpen(jumpToSettings: boolean): Promise<boolean>;
    forceOpen(jumpToSettings: boolean): Promise<boolean>;
    getUserStatus(): Promise<UserStatus>;
    acceptAll(): Promise<boolean>;
    rejectAll(): Promise<boolean>;
    getStatusForPurpose(purposeId: string): Promise<string>;
    getStatusForVendor(vendorId: string): Promise<string>;
  }

  interface EmitterSubscription {
    remove(): void;
  }

  export function addConsentListener(
    callback: (consent: string, jsonObject: Object) => void
  ): EmitterSubscription;

  export function addCloseConsentLayerListener(
    callback: () => void
  ): EmitterSubscription;

  export function addErrorListener(
    callback: (error: string) => void
  ): EmitterSubscription;

  const CmSdkReactNativeV3: CmSdkReactNativeV3Module;
  export default CmSdkReactNativeV3;
}
