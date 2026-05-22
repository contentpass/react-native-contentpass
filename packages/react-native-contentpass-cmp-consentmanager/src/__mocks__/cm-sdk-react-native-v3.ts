export const addConsentListener = jest.fn(() => ({ remove: jest.fn() }));
export const addCloseConsentLayerListener = jest.fn(() => ({
  remove: jest.fn(),
}));
export const addErrorListener = jest.fn(() => ({ remove: jest.fn() }));

const CmSdkReactNativeV3 = {
  checkAndOpen: jest.fn(),
  forceOpen: jest.fn(),
  getUserStatus: jest.fn(),
  acceptAll: jest.fn(),
  rejectAll: jest.fn(),
  getStatusForPurpose: jest.fn(),
  getStatusForVendor: jest.fn(),
};

export default CmSdkReactNativeV3;
