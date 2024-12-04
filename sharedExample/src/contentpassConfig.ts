import type { ContentpassConfig } from '@contentpass/react-native-contentpass';

export const contentpassConfig: ContentpassConfig = {
  // Testing app
  propertyId: 'cc3fc4ad-cbe5-4d09-bf85-a49796603b19',
  issuer: 'https://my.contentpass.dev',
  apiUrl: 'https://cp.cmp-sourcepoint.contenttimes.dev',
  // Staging app
  // propertyId: '78da2fd3-8b25-4642-b7b7-4a0193d00f89',
  // issuer: 'https://my.contentpass.io',
  // apiUrl: 'cp.cmp-sourcepoint.contenttimes.io',

  samplingRate: 1,
  redirectUrl: 'de.contentpass.demo://oauth',
};
