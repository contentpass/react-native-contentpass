import type { ContentpassConfig } from '@contentpass/react-native-contentpass';

export const contentpassConfig: ContentpassConfig = {
  // Testing app
  propertyId: 'cc3fc4ad-cbe5-4d09-bf85-a49796603b19',
  planId: 'a4721db5-67df-4145-bbbf-cbd09f7e0397',
  issuer: 'https://my.contentpass.dev',
  apiUrl: 'https://cp.cmp-sourcepoint.contenttimes.dev',
  // Staging app
  // propertyId: '78da2fd3-8b25-4642-b7b7-4a0193d00f89',
  // planId: '50abfd7f-8a5d-43c9-8a8c-0cb4b0cefe96',
  // issuer: 'https://my.contentpass.io',
  // apiUrl: 'cp.cmp-sourcepoint.contenttimes.io',

  samplingRate: 1,
  redirectUrl: 'de.contentpass.demo://oauth',
};
