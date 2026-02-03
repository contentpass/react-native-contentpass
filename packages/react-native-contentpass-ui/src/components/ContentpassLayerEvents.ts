export type ContentpassLayerEvents = {
  acceptAll: () => Promise<void>;
  contentpass: (route: 'login' | 'signup') => Promise<void>;
  sendEvent: (
    eventCategory: string,
    eventAction: string,
    eventLabel: string
  ) => void;
  showSecondLayer: (view: 'vendor' | 'purpose') => Promise<void>;
};
