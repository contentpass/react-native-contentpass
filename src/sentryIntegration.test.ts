import * as Sentry from '@sentry/react-native';
import { defaultStackParser, makeFetchTransport } from '@sentry/react';
import * as SentryReactNativeModule from '@sentry/react-native';
import { reportError, setSentryExtraAttribute } from './sentryIntegration';

jest.mock('@sentry/react-native', () => {
  const scope = {
    setClient: jest.fn(),
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    setExtra: jest.fn(),
  };
  return {
    ReactNativeClient: jest.fn().mockImplementation(() => ({
      init: jest.fn(),
      captureException: jest.fn(),
    })),
    Scope: jest.fn().mockImplementation(() => scope),

    // Only for internal testing
    __test_getScope: () => scope,
  };
});

describe('sentryScope', () => {
  let addBreadcrumbMock: jest.Mock;
  let captureExceptionMock: jest.Mock;

  beforeEach(() => {
    addBreadcrumbMock = jest.fn();
    captureExceptionMock = jest.fn();
    jest.spyOn(SentryReactNativeModule, 'Scope').mockReturnValue({
      setClient: jest.fn(),
      addBreadcrumb: addBreadcrumbMock,
      captureException: captureExceptionMock,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('should initialise sentry scope with correct options', () => {
    expect(Sentry.ReactNativeClient).toHaveBeenCalledWith({
      attachStacktrace: true,
      autoInitializeNativeSdk: false,
      dsn: 'https://74ab84b55b30a3800255a25eac4d089c@sentry.tools.contentpass.dev/8',
      enableAppStartTracking: false,
      enableAutoPerformanceTracing: false,
      enableCaptureFailedRequests: false,
      enableNative: false,
      enableNativeCrashHandling: false,
      enableNativeFramesTracking: false,
      enableNativeNagger: false,
      enableNdk: false,
      enableStallTracking: true,
      enableUserInteractionTracing: false,
      enableWatchdogTerminationTracking: false,
      maxQueueSize: 30,
      parentSpanIsAlwaysRootSpan: true,
      patchGlobalPromise: true,
      sendClientReports: true,
      integrations: [],
      stackParser: defaultStackParser,
      transport: makeFetchTransport,
    });
  });

  describe('reportError', () => {
    it('should add breadcrumb with message if provided', () => {
      const err = new Error('test');
      const msg = 'test message';
      // @ts-ignore
      const { addBreadcrumb, captureException } = Sentry.__test_getScope();
      reportError(err, { msg });

      expect(addBreadcrumb).toHaveBeenCalledWith({
        category: 'Error',
        message: msg,
        level: 'log',
      });
      expect(captureException).toHaveBeenCalledWith(err);
    });

    it('should not add breadcrumb if message is not provided', () => {
      const err = new Error('test');
      // @ts-ignore
      const { addBreadcrumb, captureException } = Sentry.__test_getScope();
      reportError(err);

      expect(addBreadcrumb).not.toHaveBeenCalled();
      expect(captureException).toHaveBeenCalledWith(err);
    });
  });

  describe('setSentryExtraAttribute', () => {
    it('should set extra attribute', () => {
      const key = 'testKey';
      const value = 'testValue';
      // @ts-ignore
      const { setExtra } = Sentry.__test_getScope();
      setSentryExtraAttribute(key, value);

      expect(setExtra).toHaveBeenCalledWith(key, value);
    });
  });
});
