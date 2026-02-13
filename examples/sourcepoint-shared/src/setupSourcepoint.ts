import SPConsentManager from '@sourcepoint/react-native-cmp';

const sourcePointConfig = {
  accountId: 375,
  propertyId: 37858,
  propertyName: 'mobile.cmpsourcepoint.demo',
};

const setupSourcepoint = (hasValidSubscription: boolean) => {
  const { accountId, propertyName, propertyId } = sourcePointConfig;
  const spConsentManager = new SPConsentManager();

  spConsentManager.build(accountId, propertyId, propertyName, {
    gdpr: {
      targetingParams: {
        acps: hasValidSubscription ? 'true' : 'false',
      },
    },
  });

  return spConsentManager;
};

export default setupSourcepoint;
