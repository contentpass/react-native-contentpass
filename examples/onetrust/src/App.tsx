import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import { createOnetrustCmpAdapter } from '@contentpass/react-native-contentpass-cmp-onetrust';
import {
  CONTENTPASS_CONFIG,
  GATE_TIMEOUTS,
  ONETRUST_CDN_LOCATION,
  ONETRUST_APP_ID,
  ONETRUST_LANGUAGE_CODE,
} from './Config';
import Content from './Content';

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
  // The gate only reports changes, and it starts out hidden, so false is
  // also the right value when it settles on hidden without ever calling back.
  const [consentLayerVisible, setConsentLayerVisible] = useState(false);

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

  // Checked before !cmpReady: neither startSDK() nor
  // createOnetrustCmpAdapter() failing ever sets cmpReady, so checking
  // !cmpReady first would leave the app stuck on "Loading..." forever
  // instead of ever reaching this screen.
  if (cmpFailed) {
    return (
      <View style={styles.container}>
        <Text testID="app-cmp-failed">Failed to load CMP</Text>
      </View>
    );
  }

  if (!cmpReady || !cmpAdapter) {
    return (
      <View style={styles.container}>
        <Text testID="app-loading">Loading...</Text>
      </View>
    );
  }

  return (
    <ContentpassSdkProvider contentpassConfig={CONTENTPASS_CONFIG}>
      <ContentpassConsentGate
        cmpAdapter={cmpAdapter!}
        contentpassConfig={CONTENTPASS_CONFIG}
        hideAppWhenVisible={false}
        timeouts={GATE_TIMEOUTS}
        onVisibilityChange={setConsentLayerVisible}
      >
        <View style={styles.container}>
          <Content
            cmpAdapter={cmpAdapter!}
            consentLayerVisible={consentLayerVisible}
          />
        </View>
      </ContentpassConsentGate>
    </ContentpassSdkProvider>
  );
}
