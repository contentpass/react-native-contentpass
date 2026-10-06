import type { ContentpassConfig } from '@contentpass/react-native-contentpass';
import type { ContentpassGateTimeouts } from '@contentpass/react-native-contentpass-ui';

export const CONTENTPASS_CONFIG: ContentpassConfig = {
  // Testing app
  propertyId: '78da2fd3-8b25-4642-b7b7-4a0193d00f89',
  planId: '50abfd7f-8a5d-43c9-8a8c-0cb4b0cefe96',
  issuer: 'https://my.contentpass.io',
  apiUrl: 'https://cp.cmp-onetrust.contenttimes.io',
  samplingRate: 1,
  redirectUrl: 'de.contentpass.demo://oauth',
  logLevel: 'debug',
};

export const ONETRUST_CDN_LOCATION = 'cdn.cookielaw.org';
export const ONETRUST_APP_ID =
  process.env.EXPO_PUBLIC_ONETRUST_APP_ID ||
  '019beb25-2008-72e0-8788-da1eec1f18dc-test';
export const ONETRUST_LANGUAGE_CODE = 'en';

// Lets an E2E build force every ContentpassConsentGate timeout down to the
// same tiny value, to deterministically exercise its fail-open path without
// needing the CMP or backend to actually misbehave.
const forcedTimeoutMs = process.env.EXPO_PUBLIC_GATE_TIMEOUT_MS
  ? Number(process.env.EXPO_PUBLIC_GATE_TIMEOUT_MS)
  : undefined;

// Lets an E2E run against live staging give the layer's page longer to load
// than the SDK's default, so a slow response doesn't fail the gate open
// halfway through a flow that is testing something else.
const layerPageLoadTimeoutMs = process.env
  .EXPO_PUBLIC_LAYER_PAGE_LOAD_TIMEOUT_MS
  ? Number(process.env.EXPO_PUBLIC_LAYER_PAGE_LOAD_TIMEOUT_MS)
  : undefined;

export const GATE_TIMEOUTS: ContentpassGateTimeouts | undefined =
  forcedTimeoutMs
    ? {
        cmpInitTimeoutMs: forcedTimeoutMs,
        cmpMetadataTimeoutMs: forcedTimeoutMs,
        cmpConsentStatusTimeoutMs: forcedTimeoutMs,
        authenticateTimeoutMs: forcedTimeoutMs,
        secondLayerTimeoutMs: forcedTimeoutMs,
        contentpassInitTimeoutMs: forcedTimeoutMs,
        layerPageLoadTimeoutMs: forcedTimeoutMs,
        layerReadyTimeoutMs: forcedTimeoutMs,
      }
    : layerPageLoadTimeoutMs
      ? { layerPageLoadTimeoutMs }
      : undefined;
