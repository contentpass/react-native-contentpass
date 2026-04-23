import type { ContentpassConfig } from '@contentpass/react-native-contentpass';

export const CONTENTPASS_CONFIG: ContentpassConfig = {
  // TODO: Replace with your Contentpass property/plan/apiUrl set up for Consentmanager
  propertyId: '78da2fd3-8b25-4642-b7b7-4a0193d00f89',
  planId: '50abfd7f-8a5d-43c9-8a8c-0cb4b0cefe96',
  issuer: 'https://my.contentpass.io',
  apiUrl: 'https://cp.cmp-consentmanager.contenttimes.io',
  samplingRate: 1,
  redirectUrl: 'de.contentpass.demo://oauth',
  logLevel: 'debug',
};

// TODO: Replace with your Consentmanager Code-ID (from the consentmanager dashboard)
export const CONSENTMANAGER_CODE_ID = '2b72568992e25';
export const CONSENTMANAGER_DOMAIN = 'delivery.consentmanager.net';
export const CONSENTMANAGER_LANGUAGE = 'EN';
export const CONSENTMANAGER_APP_NAME = 'ContentpassConsentmanagerExample';
