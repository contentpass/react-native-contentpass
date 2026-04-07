import {
  addConsentListener,
  addCloseConsentLayerListener,
} from 'cm-sdk-react-native-v3';
import type { CmSdkReactNativeV3Module } from 'cm-sdk-react-native-v3';
import ConsentmanagerCmpAdapter, {
  createConsentmanagerCmpAdapter,
} from './ConsentmanagerCmpAdapter';

const mockAddConsentListener = addConsentListener as jest.Mock;
const mockAddCloseConsentLayerListener =
  addCloseConsentLayerListener as jest.Mock;

function createMockSdk(
  overrides: Partial<CmSdkReactNativeV3Module> = {}
): CmSdkReactNativeV3Module {
  return {
    checkAndOpen: jest.fn().mockResolvedValue(true),
    forceOpen: jest.fn().mockResolvedValue(true),
    getUserStatus: jest.fn().mockResolvedValue({
      status: 'consentGiven',
      vendors: { s2789: 'granted', s2790: 'granted' },
      purposes: { c51: 'granted', c52: 'granted', c53: 'denied' },
      tcf: '',
      addtlConsent: '',
      regulation: 'gdpr',
    }),
    acceptAll: jest.fn().mockResolvedValue(true),
    rejectAll: jest.fn().mockResolvedValue(true),
    getStatusForPurpose: jest.fn().mockResolvedValue('granted'),
    getStatusForVendor: jest.fn().mockResolvedValue('granted'),
    ...overrides,
  };
}

describe('createConsentmanagerCmpAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an adapter from the SDK', async () => {
    const sdk = createMockSdk();
    const adapter = await createConsentmanagerCmpAdapter(sdk);
    expect(adapter).toBeInstanceOf(ConsentmanagerCmpAdapter);
    expect(sdk.getUserStatus).toHaveBeenCalled();
  });

  it('should throw if getUserStatus fails', async () => {
    const sdk = createMockSdk({
      getUserStatus: jest.fn().mockRejectedValue(new Error('SDK not ready')),
    });

    await expect(createConsentmanagerCmpAdapter(sdk)).rejects.toThrow(
      'SDK not ready'
    );
  });
});

describe('ConsentmanagerCmpAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddConsentListener.mockReturnValue({ remove: jest.fn() });
    mockAddCloseConsentLayerListener.mockReturnValue({ remove: jest.fn() });
  });

  describe('waitForInit', () => {
    it('should resolve immediately', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.waitForInit()).resolves.toBeUndefined();
    });
  });

  describe('acceptAll', () => {
    it('should call sdk.acceptAll', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await adapter.acceptAll();
      expect(sdk.acceptAll).toHaveBeenCalled();
    });

    it('should emit consent status change after accepting', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      const listener = jest.fn();
      adapter.onConsentStatusChange(listener);

      await new Promise((resolve) => setTimeout(resolve, 10));
      listener.mockClear();

      await adapter.acceptAll();
      expect(listener).toHaveBeenCalledWith(true);
    });
  });

  describe('denyAll', () => {
    it('should call sdk.rejectAll', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await adapter.denyAll();
      expect(sdk.rejectAll).toHaveBeenCalled();
    });
  });

  describe('getNumberOfVendors', () => {
    it('should return the vendor count from initial user status', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.getNumberOfVendors()).resolves.toBe(2);
    });

    it('should return 0 when no vendors exist', async () => {
      const sdk = createMockSdk({
        getUserStatus: jest.fn().mockResolvedValue({
          status: 'consentGiven',
          vendors: {},
          purposes: { c51: 'granted' },
          tcf: '',
          addtlConsent: '',
          regulation: 'gdpr',
        }),
      });
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.getNumberOfVendors()).resolves.toBe(0);
    });
  });

  describe('getRequiredPurposes', () => {
    it('should return purpose IDs from initial user status', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.getRequiredPurposes()).resolves.toEqual([
        'c51',
        'c52',
        'c53',
      ]);
    });
  });

  describe('hasFullConsent', () => {
    it('should return true when all purposes are granted', async () => {
      const sdk = createMockSdk({
        getStatusForPurpose: jest.fn().mockResolvedValue('granted'),
      });
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.hasFullConsent()).resolves.toBe(true);
    });

    it('should return false when any purpose is denied', async () => {
      const sdk = createMockSdk({
        getStatusForPurpose: jest
          .fn()
          .mockResolvedValueOnce('granted')
          .mockResolvedValueOnce('denied')
          .mockResolvedValueOnce('granted'),
      });
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.hasFullConsent()).resolves.toBe(false);
    });

    it('should return false when choice does not exist', async () => {
      const sdk = createMockSdk({
        getStatusForPurpose: jest
          .fn()
          .mockResolvedValue('choiceDoesntExist'),
      });
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.hasFullConsent()).resolves.toBe(false);
    });

    it('should return false when no purposes exist', async () => {
      const sdk = createMockSdk({
        getUserStatus: jest.fn().mockResolvedValue({
          status: '',
          vendors: {},
          purposes: {},
          tcf: '',
          addtlConsent: '',
          regulation: '',
        }),
      });
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await expect(adapter.hasFullConsent()).resolves.toBe(false);
    });
  });

  describe('onConsentStatusChange', () => {
    it('should emit initial consent status asynchronously', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      const listener = jest.fn();

      adapter.onConsentStatusChange(listener);
      expect(listener).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should return an unsubscribe function', async () => {
      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      const listener = jest.fn();

      const unsubscribe = adapter.onConsentStatusChange(listener);
      unsubscribe();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('showSecondLayer', () => {
    it('should call forceOpen(true) on the SDK', async () => {
      const mockRemove = jest.fn();
      mockAddCloseConsentLayerListener.mockImplementation(
        (cb: () => void) => {
          setTimeout(cb, 0);
          return { remove: mockRemove };
        }
      );

      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);
      await adapter.showSecondLayer('purpose');

      expect(sdk.forceOpen).toHaveBeenCalledWith(true);
      expect(mockRemove).toHaveBeenCalled();
    });

    it('should resolve when the consent layer is closed', async () => {
      let closeCallback: (() => void) | undefined;
      mockAddCloseConsentLayerListener.mockImplementation(
        (cb: () => void) => {
          closeCallback = cb;
          return { remove: jest.fn() };
        }
      );

      const sdk = createMockSdk();
      const adapter = await createConsentmanagerCmpAdapter(sdk);

      const promise = adapter.showSecondLayer('vendor');
      expect(closeCallback).toBeDefined();

      closeCallback!();
      await expect(promise).resolves.toBeUndefined();
    });
  });
});
