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

  it('should fail clearly when OneTrust returns no preference center data', async () => {
    const { sdk } = createMockSdk({
      getPreferenceCenterData: jest.fn().mockResolvedValue(null),
    });

    await expect(createOnetrustCmpAdapter(sdk)).rejects.toThrow(
      'OneTrust returned no preference center data after fetching CMP API data'
    );
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

  it('should accept consent during the banner settlement period', async () => {
    jest.useFakeTimers();
    try {
      const { sdk } = createMockSdk({
        shouldShowBanner: jest.fn().mockResolvedValue(true),
      });
      const adapter = await createOnetrustCmpAdapter(sdk);

      await expect(adapter.hasFullConsent()).resolves.toBe(false);

      await adapter.acceptAll();

      await expect(adapter.hasFullConsent()).resolves.toBe(true);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('should require consent when the banner remains visible after the settlement period', async () => {
    jest.useFakeTimers();
    try {
      const now = new Date('2026-07-20T12:00:00.000Z');
      jest.setSystemTime(now);
      const { sdk } = createMockSdk({
        shouldShowBanner: jest.fn().mockResolvedValue(true),
      });
      const adapter = await createOnetrustCmpAdapter(sdk);

      await adapter.acceptAll();
      await expect(adapter.hasFullConsent()).resolves.toBe(true);

      jest.setSystemTime(new Date(now.getTime() + 10_001));
      await expect(adapter.hasFullConsent()).resolves.toBe(false);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('should require consent again after rejecting the Contentpass banner', async () => {
    jest.useFakeTimers();
    try {
      const { sdk } = createMockSdk({
        shouldShowBanner: jest.fn().mockResolvedValue(true),
      });
      const adapter = await createOnetrustCmpAdapter(sdk);

      await adapter.acceptAll();
      await expect(adapter.hasFullConsent()).resolves.toBe(true);

      await adapter.denyAll();
      await expect(adapter.hasFullConsent()).resolves.toBe(false);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
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

  it('should accept consent during the banner settlement period after accepting all in the preference center', async () => {
    const { sdk, eventHandlers } = createMockSdk({
      shouldShowBanner: jest.fn().mockResolvedValue(true),
    });
    const adapter = await createOnetrustCmpAdapter(sdk);
    const listener = jest.fn();

    adapter.onConsentStatusChange(listener);
    await flushPromises();
    listener.mockClear();

    eventHandlers.get(OTEventName.preferenceCenterAcceptAll)?.();
    await flushPromises();

    expect(listener).toHaveBeenCalledWith(true);
  });

  it('should refresh consent after the preference center closes', async () => {
    jest.useFakeTimers();
    try {
      let bannerReads = 0;
      let statusReads = 0;
      const { sdk, eventHandlers } = createMockSdk({
        shouldShowBanner: jest.fn(() =>
          Promise.resolve(bannerReads++ >= 3 ? false : true)
        ),
        getConsentStatusForCategory: jest.fn(() =>
          Promise.resolve(Math.floor(statusReads++ / 2) >= 3 ? 1 : 0)
        ),
      });
      const adapter = await createOnetrustCmpAdapter(sdk);
      const listener = jest.fn();

      adapter.onConsentStatusChange(listener);
      await jest.advanceTimersByTimeAsync(0);
      listener.mockClear();

      const secondLayer = adapter.showSecondLayer('purpose');
      eventHandlers.get(OTEventName.preferenceCenterConfirmChoices)?.();
      await secondLayer;
      await jest.advanceTimersByTimeAsync(100);

      expect(listener).toHaveBeenCalledWith(true);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
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
