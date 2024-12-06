import { defaultStackParser, makeFetchTransport } from '@sentry/react';
import * as SentryReactNativeModule from '@sentry/react-native';
import {
  __internal_reset_sentry_scope,
  initSentry,
  reportError,
} from './sentryIntegration';
import logger from './logger';

jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'android',
      Version: '10.1.2',
    },
  };
});

describe('sentryIntegration', () => {
  let addBreadcrumbMock: jest.Mock;
  let captureExceptionMock: jest.Mock;
  let setTagsMock: jest.Mock;
  let ReactNativeClientSpy: jest.SpyInstance;
  let ScopeSpy: jest.SpyInstance;

  beforeEach(() => {
    addBreadcrumbMock = jest.fn();
    captureExceptionMock = jest.fn();
    setTagsMock = jest.fn();
    ScopeSpy = jest.spyOn(SentryReactNativeModule, 'Scope').mockReturnValue({
      setClient: jest.fn(),
      init: jest.fn(),
      addBreadcrumb: addBreadcrumbMock,
      captureException: captureExceptionMock,
      setTags: setTagsMock,
    } as any);

    ReactNativeClientSpy = jest
      .spyOn(SentryReactNativeModule, 'ReactNativeClient')
      .mockImplementation(
        () =>
          ({
            init: jest.fn(),
          }) as any
      );

    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    __internal_reset_sentry_scope();
  });

  it('should not initialise sentry scope if already initialised', () => {
    initSentry({ propertyId: 'test-id' });
    initSentry({ propertyId: 'test-id' });

    expect(logger.warn).toHaveBeenCalledWith('Sentry already initialized');
    expect(ReactNativeClientSpy).toHaveBeenCalledTimes(1);
    expect(ScopeSpy).toHaveBeenCalledTimes(1);
  });

  it('should initialise sentry scope with correct options', () => {
    initSentry({ propertyId: 'test-id' });

    expect(ReactNativeClientSpy).toHaveBeenCalledWith({
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
      environment: 'development',
      maxQueueSize: 30,
      parentSpanIsAlwaysRootSpan: true,
      patchGlobalPromise: true,
      sendClientReports: true,
      integrations: undefined,
      stackParser: defaultStackParser,
      transport: makeFetchTransport,
    });

    expect(setTagsMock).toHaveBeenCalledWith({
      OS: 'android',
      platformVersion: '10.1.2',
      propertyId: 'test-id',
    });
  });

  describe('reportError', () => {
    it('should add breadcrumb with message if provided', () => {
      initSentry({ propertyId: 'test-id' });
      const err = new Error('test');
      const msg = 'test message';

      reportError(err, { msg });

      expect(addBreadcrumbMock).toHaveBeenCalledWith({
        category: 'Error',
        message: msg,
        level: 'log',
      });
      expect(captureExceptionMock).toHaveBeenCalledWith(err);
    });

    it('should not add breadcrumb if message is not provided', () => {
      initSentry({ propertyId: 'test-id' });
      const err = new Error('test');

      reportError(err);

      expect(addBreadcrumbMock).not.toHaveBeenCalled();
      expect(captureExceptionMock).toHaveBeenCalledWith(err);
    });

    it('should not throw error when reportError is called before initSentry', () => {
      const err = new Error('test');
      const msg = 'test message';

      reportError(err, { msg });

      expect(logger.error).toHaveBeenCalledWith({ err }, msg);
      expect(addBreadcrumbMock).not.toHaveBeenCalled();
      expect(captureExceptionMock).not.toHaveBeenCalledWith(err);
    });
  });
});
