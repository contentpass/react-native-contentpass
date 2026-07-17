import type OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { OTEventName } from 'react-native-onetrust-cmp';
import OnetrustCmpAdapter, {
  createOnetrustCmpAdapter,
} from './OnetrustCmpAdapter';
import type { BannerData, PreferenceCenterData } from './types';

jest.mock('react-native-onetrust-cmp', () => ({
  OTConsentInteraction: {
    bannerAllowAll: 'bannerAllowAll',
    bannerRejectAll: 'bannerRejectAll',
  },
  OTEventName: {
    hidePreferenceCenter: 'hidePreferenceCenter',
    preferenceCenterAcceptAll: 'preferenceCenterAcceptAll',
    preferenceCenterRejectAll: 'preferenceCenterRejectAll',
    preferenceCenterConfirmChoices: 'preferenceCenterConfirmChoices',
    hideVendorList: 'hideVendorList',
    vendorConfirmChoices: 'vendorConfirmChoices',
    allSDKViewsDismissed: 'allSDKViewsDismissed',
  },
}));

type EventHandler = (data?: any) => void;

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function createBannerData(description = 'We use 42 vendors'): BannerData {
  return {
    otConsentString: '',
    bannerUIData: {
      summary: {
        description: {
          text: description,
          textAlign: '',
          textColor: '',
          textColorDark: '',
          fontSize: '',
        },
        dpdTitle: {} as any,
        title: {} as any,
        dpdDescription: {} as any,
      },
      buttons: {} as any,
      general: {} as any,
      logo: {} as any,
    },
    appConfig: {},
    storageKeys: {},
  };
}

function createPreferenceCenterData(): PreferenceCenterData {
  return {
    purposes: [
      {
        groupId: 'C0001',
        isIabPurpose: true,
        purposeId: '1',
      },
      {
        groupId: 'C0002',
        isIabPurpose: true,
        purposeId: '2',
      },
    ] as any,
    pcUIData: {},
    appConfig: {},
    otConsentString: '',
    storageKeys: {},
  };
}

function createMockSdk(overrides: Partial<OTPublishersNativeSDK> = {}): {
  sdk: OTPublishersNativeSDK;
  eventHandlers: Map<OTEventName, EventHandler>;
} {
  const eventHandlers = new Map<OTEventName, EventHandler>();
  const sdk = {
    fetchPreferencesCmpApiData: jest.fn().mockResolvedValue(undefined),
    getBannerData: jest.fn().mockResolvedValue(createBannerData()),
    getPreferenceCenterData: jest
      .fn()
      .mockResolvedValue(createPreferenceCenterData()),
    saveConsent: jest.fn().mockResolvedValue(undefined),
    shouldShowBanner: jest.fn().mockResolvedValue(false),
    getConsentStatusForCategory: jest.fn().mockResolvedValue(1),
    addEventListener: jest.fn(
      (eventName: OTEventName, handler: EventHandler) => {
        eventHandlers.set(eventName, handler);
        return { remove: jest.fn() };
      }
    ),
    showPreferenceCenterUI: jest.fn(),
    showConsentPurposesUI: jest.fn(),
    ...overrides,
  } as OTPublishersNativeSDK;

  return { sdk, eventHandlers };
}

async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('createOnetrustCmpAdapter', () => {
  it('should create an adapter from the SDK data', async () => {
    const { sdk } = createMockSdk();
    const adapter = await createOnetrustCmpAdapter(sdk);
    expect(adapter).toBeInstanceOf(OnetrustCmpAdapter);
    expect(sdk.fetchPreferencesCmpApiData).toHaveBeenCalled();
    expect(sdk.getBannerData).toHaveBeenCalled();
    expect(sdk.getPreferenceCenterData).toHaveBeenCalled();
  });
});

describe('OnetrustCmpAdapter', () => {
  it('should report full consent when all purposes are accepted and no banner is required', async () => {
    const { sdk } = createMockSdk();
    const adapter = await createOnetrustCmpAdapter(sdk);

    await expect(adapter.hasFullConsent()).resolves.toBe(true);
  });

  it('should report missing consent when OneTrust requires reconsent', async () => {
    const { sdk } = createMockSdk({
      shouldShowBanner: jest.fn().mockResolvedValue(true),
    });
    const adapter = await createOnetrustCmpAdapter(sdk);

    await expect(adapter.hasFullConsent()).resolves.toBe(false);
  });

  it('should ignore an initial status read that resolves after accept all', async () => {
    jest.useFakeTimers();
    try {
      const initialShouldShowBanner = createDeferred<boolean>();
      const shouldShowBanner = jest
        .fn()
        .mockReturnValueOnce(initialShouldShowBanner.promise)
        .mockResolvedValue(false);
      const { sdk } = createMockSdk({ shouldShowBanner });
      const adapter = await createOnetrustCmpAdapter(sdk);
      const listener = jest.fn();

      adapter.onConsentStatusChange(listener);
      jest.advanceTimersByTime(0);
      await Promise.resolve();

      await adapter.acceptAll();
      expect(listener).toHaveBeenCalledWith(true);
      listener.mockClear();

      initialShouldShowBanner.resolve(true);
      await Promise.resolve();
      await Promise.resolve();

      expect(listener).not.toHaveBeenCalled();
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('should not require ATT-linked groups for full Contentpass consent', async () => {
    const { sdk } = createMockSdk({
      getConsentStatusForCategory: jest.fn((groupId: string) =>
        Promise.resolve(groupId === 'C0002' ? 0 : 1)
      ),
    });
    const adapter = await createOnetrustCmpAdapter(sdk, {
      attGroupIds: ['C0002'],
    });

    await expect(adapter.hasFullConsent()).resolves.toBe(true);
  });

  it('should emit consent status when OneTrust confirms preference-center choices', async () => {
    const { sdk, eventHandlers } = createMockSdk({
      getConsentStatusForCategory: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0),
    });
    const adapter = await createOnetrustCmpAdapter(sdk);
    const listener = jest.fn();

    adapter.onConsentStatusChange(listener);
    await flushPromises();
    listener.mockClear();

    eventHandlers.get(OTEventName.preferenceCenterConfirmChoices)?.();
    await flushPromises();

    expect(listener).toHaveBeenCalledWith(false);
  });

  it('should emit consent status when OneTrust rejects all in the preference center', async () => {
    const { sdk, eventHandlers } = createMockSdk({
      getConsentStatusForCategory: jest.fn().mockResolvedValue(0),
    });
    const adapter = await createOnetrustCmpAdapter(sdk);
    const listener = jest.fn();

    adapter.onConsentStatusChange(listener);
    await flushPromises();
    listener.mockClear();

    eventHandlers.get(OTEventName.preferenceCenterRejectAll)?.();
    await flushPromises();

    expect(listener).toHaveBeenCalledWith(false);
  });

  it('should not emit consent status for close-only OneTrust events', async () => {
    const { sdk, eventHandlers } = createMockSdk();
    const adapter = await createOnetrustCmpAdapter(sdk);
    const listener = jest.fn();

    adapter.onConsentStatusChange(listener);
    await flushPromises();
    listener.mockClear();

    eventHandlers.get(OTEventName.hidePreferenceCenter)?.();
    await flushPromises();

    expect(listener).not.toHaveBeenCalled();
  });
});
