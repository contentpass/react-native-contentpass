import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import { createOnetrustCmpAdapter } from '@contentpass/react-native-contentpass-cmp-onetrust';
import { contentpassConfigTesting as contentpassConfig } from './contentpassConfig';
import Content from './Content';

const ONETRUST_CDN_LOCATION = 'cdn.cookielaw.org';
const ONETRUST_APP_ID = '019beb25-2008-72e0-8788-da1eec1f18dc-test';
const ONETRUST_LANGUAGE_CODE = 'en';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});

export default function App() {
  const [cmpReady, setCmpReady] = useState(false);
  const [cmpFailed, setCmpFailed] = useState(false);
  const [cmpAdapter, setCmpAdapter] = useState<CmpAdapter | null>(null);

  useEffect(() => {
    OTPublishersNativeSDK.startSDK(
      ONETRUST_CDN_LOCATION,
      ONETRUST_APP_ID,
      ONETRUST_LANGUAGE_CODE,
      {},
      false
    )
      .then(() => {
        createOnetrustCmpAdapter(OTPublishersNativeSDK)
          .then((onetrustCmpAdapter: CmpAdapter) => {
            setCmpAdapter(onetrustCmpAdapter);
            setCmpReady(true);
          })
          .catch((error: any) => {
            console.error('Failed to create CMP adapter', error);
            setCmpFailed(true);
          });
      })
      .catch((error: any) => {
        console.error('Failed to load CMP', error);
        setCmpFailed(true);
      });
  }, []);

  if (!cmpReady) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (cmpFailed || !cmpAdapter) {
    return (
      <View style={styles.container}>
        <Text>Failed to load CMP</Text>
      </View>
    );
  }

  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <ContentpassConsentGate
        cmpAdapter={cmpAdapter!}
        contentpassConfig={contentpassConfig}
        hideAppWhenVisible={false}
      >
        <View style={styles.container}>
          <Content cmpAdapter={cmpAdapter!} />
        </View>
      </ContentpassConsentGate>
    </ContentpassSdkProvider>
  );
}
