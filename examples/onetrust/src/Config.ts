import type { ContentpassConfig } from '@contentpass/react-native-contentpass';

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
export const ONETRUST_APP_ID = '019beb25-2008-72e0-8788-da1eec1f18dc-test';
export const ONETRUST_LANGUAGE_CODE = 'en';
