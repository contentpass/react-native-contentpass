import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import CmSdkReactNativeV3, {
  setUrlConfig,
  setWebViewConfig,
  isConsentRequired,
  WebViewPosition,
  BackgroundStyle,
} from 'cm-sdk-react-native-v3';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import { createConsentmanagerCmpAdapter } from '@contentpass/react-native-contentpass-cmp-consentmanager';
import {
  CONTENTPASS_CONFIG,
  CONSENTMANAGER_CODE_ID,
  CONSENTMANAGER_DOMAIN,
  CONSENTMANAGER_LANGUAGE,
  CONSENTMANAGER_APP_NAME,
} from './Config';
import Content from './Content';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function App() {
  const [cmpReady, setCmpReady] = useState(false);
  const [cmpFailed, setCmpFailed] = useState(false);
  const [cmpAdapter, setCmpAdapter] = useState<CmpAdapter | null>(null);

  useEffect(() => {
    const init = async () => {
      // setWebViewConfig still has to be called because the Consentmanager SDK
      // uses this WebView to display the second layer (granular settings),
      // which is opened via `cmpAdapter.showSecondLayer()`.
      await setWebViewConfig({
        position: WebViewPosition.FullScreen,
        backgroundStyle: BackgroundStyle.dimmed('black', 0.5),
      });

      await setUrlConfig({
        id: CONSENTMANAGER_CODE_ID,
        domain: CONSENTMANAGER_DOMAIN,
        language: CONSENTMANAGER_LANGUAGE,
        appName: CONSENTMANAGER_APP_NAME,
      });

      // Trigger the Consentmanager SDK to fetch its server-side configuration
      // (purposes, vendors, whether consent is required) without opening the
      // Consentmanager consent layer. We deliberately do NOT call
      // `checkAndOpen()` here because that would display Consentmanager's own
      // first-layer UI; we want Contentpass's layer to handle that instead.
      await isConsentRequired();

      const adapter = await createConsentmanagerCmpAdapter(CmSdkReactNativeV3);
      setCmpAdapter(adapter);
      setCmpReady(true);
    };

    init().catch((error: unknown) => {
      console.error('Failed to initialize Consentmanager CMP', error);
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
    <ContentpassSdkProvider contentpassConfig={CONTENTPASS_CONFIG}>
      <ContentpassConsentGate
        cmpAdapter={cmpAdapter!}
        contentpassConfig={CONTENTPASS_CONFIG}
        hideAppWhenVisible={false}
        locale="de"
      >
        <View style={styles.container}>
          <Content cmpAdapter={cmpAdapter!} />
        </View>
      </ContentpassConsentGate>
    </ContentpassSdkProvider>
  );
}
