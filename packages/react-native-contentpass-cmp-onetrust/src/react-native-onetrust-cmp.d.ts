declare module 'react-native-onetrust-cmp' {
  export enum OTConsentInteraction {
    bannerAllowAll = 'bannerAllowAll',
    bannerRejectAll = 'bannerRejectAll',
  }

  export enum OTEventName {
    hidePreferenceCenter = 'hidePreferenceCenter',
    preferenceCenterAcceptAll = 'preferenceCenterAcceptAll',
    preferenceCenterRejectAll = 'preferenceCenterRejectAll',
    preferenceCenterConfirmChoices = 'preferenceCenterConfirmChoices',
    hideVendorList = 'hideVendorList',
    vendorConfirmChoices = 'vendorConfirmChoices',
    allSDKViewsDismissed = 'allSDKViewsDismissed',
  }

  export default interface OTPublishersNativeSDK {
    getBannerData(): Promise<any>;
    getPreferenceCenterData(): Promise<any>;
    saveConsent(interaction: OTConsentInteraction): Promise<void>;
    getConsentStatusForCategory(categoryId: string): Promise<number>;
    addEventListener(
      eventName: OTEventName,
      handler: (data?: any) => void
    ): { remove: () => void };
    showPreferenceCenterUI(): void;
    showConsentPurposesUI(): void;
  }
}
