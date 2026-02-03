import * as Sentry from '@sentry/react-native';
import { defaultStackParser, makeFetchTransport } from '@sentry/react';
import { getDefaultIntegrations } from '@sentry/react-native/dist/js/integrations/default';
import logger from './logger';
import { Platform } from 'react-native';

// as it's only the open source package, we want to have minimal sentry configuration here to not override sentry instance,
// which can be used in the application
const options = {
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
  stackParser: defaultStackParser,
  transport: makeFetchTransport,
  integrations: [],
  environment: __DEV__ ? 'development' : 'production',
};

type InitSentryArgs = {
  propertyId: string;
};

let sentryScope: Sentry.Scope | null = null;

export const initSentry = (args: InitSentryArgs) => {
  if (sentryScope) {
    logger.warn('Sentry already initialized');
    return;
  }

  const sentryClient = new Sentry.ReactNativeClient({
    ...options,
    integrations: getDefaultIntegrations(options),
  });

  sentryScope = new Sentry.Scope();
  sentryScope.setClient(sentryClient);

  sentryClient.init();

  sentryScope.setTags({
    propertyId: args.propertyId,
    OS: Platform.OS,
    platformVersion: Platform.Version,
  });
};

type ReportErrorOptions = {
  msg?: string;
};

export const reportError = (err: Error, { msg }: ReportErrorOptions = {}) => {
  logger.error({ err }, msg || 'Unexpected error');
  if (!sentryScope) {
    return;
  }

  if (msg) {
    sentryScope.addBreadcrumb({
      category: 'Error',
      message: msg,
      level: 'log',
    });
  }

  sentryScope.captureException(err);
};

export const __internal_reset_sentry_scope = () => {
  sentryScope = null;
};
