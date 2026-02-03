export type CmpAdapter = {
  acceptAll: () => Promise<void>;
  denyAll: () => Promise<void>;
  getCustomPurposes?: (
    supportedLanguages: string[]
  ) => Promise<Map<string, string>>;
  getNumberOfVendors: () => Promise<number>;
  getRequiredPurposes: () => Promise<string[]>;
  hasFullConsent: () => Promise<boolean>;
  onConsentStatusChange: (callback: (fullConsent: boolean) => void) => void;
  onAdapterEvent?: (
    eventName: string,
    callback: (data?: any) => void
  ) => () => void;
  onEvent?: (callback: (eventName: string, data?: any) => void) => () => void;
  showSecondLayer: (view: 'vendor' | 'purpose') => Promise<void>;
  waitForInit: () => Promise<void>;
};
