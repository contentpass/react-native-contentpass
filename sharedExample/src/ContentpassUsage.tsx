import { useContentpassSdk } from './ContentpassContext';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthenticateResult } from 'react-native-contentpass';
import {
  SPConsentManager,
  type SPUserData,
} from '@sourcepoint/react-native-cmp';

const styles = StyleSheet.create({
  sourcepointDataContainer: {
    padding: 10,
    height: 400,
    flexGrow: 0,
  },
  logsView: {
    marginTop: 10,
  },
});

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

export default function ContentpassUsage() {
  const [authResult, setAuthResult] = useState<
    AuthenticateResult | undefined
  >();
  const contentpassSdk = useContentpassSdk();
  const spConsentManager = useRef<SPConsentManager | null>();
  const [sourcepointUserData, setSourcepointUserData] = useState<
    SPUserData | undefined
  >();

  const authenticate = useCallback(async () => {
    spConsentManager.current?.dispose();
    const result = await contentpassSdk.authenticate();
    setAuthResult(result);
  }, [contentpassSdk]);

  useEffect(() => {
    spConsentManager.current = setupSourcepoint(
      authResult?.hasValidSubscription ?? false
    );

    spConsentManager.current?.onFinished(() => {
      spConsentManager.current?.getUserData().then(setSourcepointUserData);
    });

    spConsentManager.current?.onAction((action) => {
      if (action.customActionId === "cp('login')") {
        authenticate();
      }
    });

    spConsentManager.current?.loadMessage();

    return () => {
      spConsentManager.current?.dispose();
    };
  }, [authResult, authenticate]);

  const clearSourcepointData = () => {
    spConsentManager.current?.clearLocalData();
    setSourcepointUserData(undefined);
    spConsentManager.current?.loadMessage();
  };

  return (
    <>
      <Button title={'Clear sourcepoint data'} onPress={clearSourcepointData} />
      <View style={styles.logsView}>
        <Text>Authenticate result:</Text>
        <Text>{JSON.stringify(authResult, null, 2)}</Text>
        <Text>Sourcepoint user data:</Text>
        <ScrollView style={styles.sourcepointDataContainer}>
          <Text>{JSON.stringify(sourcepointUserData, null, 2)}</Text>
        </ScrollView>
      </View>
    </>
  );
}
