// jest-setup.ts swaps @sentry/react-native for a stub whose `init` is a no-op. The
// behaviour under test is what the real `ReactNativeClient.init()` does to `NATIVE`, the
// bridge object every Sentry client in the app shares, so these tests use the real module.
jest.unmock('@sentry/react-native');
jest.unmock('@sentry/react-native/dist/js/integrations/default');
jest.unmock('@sentry/react-native/dist/js/wrapper');

jest.mock('@sentry/react', () => ({
  ...jest.requireActual('@sentry/react'),
  makeFetchTransport: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue({}),
    flush: jest.fn().mockResolvedValue(true),
  }),
}));

// Sentry starts cleanup intervals when its modules load and again inside
// `getDefaultIntegrations()`, and never unrefs them, so everything is loaded under fake
// timers to let Jest exit. `setImmediate` stays real because Sentry's error-handlers
// integration replaces the global Promise with a polyfill scheduled on it.
jest.useFakeTimers({ doNotFake: ['setImmediate'] });

let NATIVE: typeof import('@sentry/react-native/dist/js/wrapper').NATIVE;
let sentryIntegration: typeof import('./sentryIntegration');

beforeAll(() => {
  ({ NATIVE } = require('@sentry/react-native/dist/js/wrapper'));
  sentryIntegration = require('./sentryIntegration');
});

const settleNativeInit = (spy: jest.SpyInstance) =>
  Promise.all(spy.mock.results.map((result) => result.value));

describe('initSentry and the native bridge shared with the host app', () => {
  let initNativeSdkSpy: jest.SpyInstance;

  beforeEach(() => {
    initNativeSdkSpy = jest.spyOn(NATIVE, 'initNativeSdk');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sentryIntegration.__internal_reset_sentry_scope();
    NATIVE.enableNative = true;
  });

  it('initialises the Contentpass client with native disabled', async () => {
    sentryIntegration.initSentry({ propertyId: 'test-id' });

    expect(initNativeSdkSpy).toHaveBeenCalledTimes(1);
    expect(initNativeSdkSpy).toHaveBeenCalledWith(
      expect.objectContaining({ enableNative: false })
    );
    await settleNativeInit(initNativeSdkSpy);
  });

  it("leaves the host app's native SDK enabled", async () => {
    NATIVE.enableNative = true;

    sentryIntegration.initSentry({ propertyId: 'test-id' });
    await settleNativeInit(initNativeSdkSpy);

    expect(NATIVE.enableNative).toBe(true);
  });

  it('keeps native disabled when the host app disabled it', async () => {
    NATIVE.enableNative = false;

    sentryIntegration.initSentry({ propertyId: 'test-id' });
    await settleNativeInit(initNativeSdkSpy);

    expect(NATIVE.enableNative).toBe(false);
  });
});
