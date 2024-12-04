import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  type ContentpassState,
  ContentpassStateType,
  useContentpassSdk,
} from '@contentpass/react-native-contentpass';
import {
  SPConsentManager,
  type SPUserData,
} from '@sourcepoint/react-native-cmp';
import setupSourcepoint from './setupSourcepoint';

const styles = StyleSheet.create({
  scrollViewLogsContainer: {
    padding: 10,
    height: 200,
    flexGrow: 0,
  },
  resultsText: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    display: 'flex',
    gap: 4,
    marginTop: 10,
  },
  logsView: {
    marginTop: 10,
  },
});

export default function ContentpassUsage() {
  const [authResult, setAuthResult] = useState<ContentpassState | undefined>();
  const contentpassSdk = useContentpassSdk();
  const spConsentManager = useRef<SPConsentManager | null>();
  const [sourcepointUserData, setSourcepointUserData] = useState<
    SPUserData | undefined
  >();

  useEffect(() => {
    // wait for the authResult to be set before setting up Sourcepoint
    if (!authResult || authResult.state === ContentpassStateType.INITIALISING) {
      return;
    }

    spConsentManager.current = setupSourcepoint(
      authResult?.hasValidSubscription ?? false
    );

    spConsentManager.current?.onFinished(() => {
      spConsentManager.current?.getUserData().then(setSourcepointUserData);
    });

    spConsentManager.current?.onAction((action) => {
      if (action.customActionId === "cp('login')") {
        contentpassSdk
          .authenticate()
          .then(() => {
            // eslint-disable-next-line no-console
            console.log('Successfully authenticated');
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Failed to authenticate:', err);
          });
      }
    });

    spConsentManager.current?.loadMessage();

    return () => {
      spConsentManager.current?.dispose();
    };
  }, [authResult, contentpassSdk]);

  useEffect(() => {
    const onContentpassStateChange = (state: ContentpassState) => {
      setAuthResult(state);
    };

    contentpassSdk.registerObserver(onContentpassStateChange);

    return () => {
      contentpassSdk.unregisterObserver(onContentpassStateChange);
    };
  }, [contentpassSdk]);

  const clearSourcepointData = () => {
    spConsentManager.current?.clearLocalData();
    setSourcepointUserData(undefined);
    spConsentManager.current?.loadMessage();
  };

  return (
    <>
      <View style={styles.buttonsContainer}>
        <Button
          title={'Clear sourcepoint data'}
          onPress={clearSourcepointData}
        />
        <Button title={'Logout'} onPress={contentpassSdk.logout} />
      </View>
      <View style={styles.logsView}>
        <Text style={styles.resultsText}>Authenticate result:</Text>
        <ScrollView style={styles.scrollViewLogsContainer}>
          <Text>{JSON.stringify(authResult, null, 2)}</Text>
        </ScrollView>
        <Text style={styles.resultsText}>Sourcepoint user data:</Text>
        <ScrollView style={styles.scrollViewLogsContainer}>
          <Text>{JSON.stringify(sourcepointUserData, null, 2)}</Text>
        </ScrollView>
      </View>
    </>
  );
}
