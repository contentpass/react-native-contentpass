import { StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ContentpassLayerEvents } from './ContentpassLayerEvents';
import buildFirstLayerUrl from './buildFirstLayerUrl';
import { useMemo, useState } from 'react';

const MESSAGE_PROTOCOL = 'contentpass-first-layer';

const GLUE_CODE_JS = `
  (function () {
    const originalPostMessage = window.postMessage;
    window.postMessage = function (data) {
      try {
        window.ReactNativeWebView.postMessage(
          typeof data === 'string' ? data : JSON.stringify(data)
        );
      } catch (e) {}
      if (originalPostMessage) {
        originalPostMessage.apply(window, arguments);
      }
    };

    true;
  })();
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default function ContentpassLayer({
  baseUrl,
  eventHandler,
  planId,
  propertyId,
  purposesList,
  vendorCount,
}: {
  baseUrl: string;
  eventHandler: ContentpassLayerEvents;
  planId: string;
  propertyId: string;
  purposesList: string[];
  vendorCount: number;
}) {
  const firstLayerUrl = useMemo(() => {
    return buildFirstLayerUrl({
      baseUrl,
      propertyId,
      planId,
      purposesList,
      vendorCount,
    });
  }, [baseUrl, planId, propertyId, purposesList, vendorCount]);

  const [ready, setReady] = useState(false);

  function handleMessage(event: WebViewMessageEvent) {
    let msg: any;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch (error) {
      console.error('Error parsing WebView message', error);
      return;
    }

    if (!msg || msg.protocol !== MESSAGE_PROTOCOL) {
      console.warn('WebView message with unknown protocol', msg.protocol, msg);
      return;
    }

    if (msg.type !== 'REQUEST') {
      console.warn('WebView message with unknown type', msg.type, msg);
      return;
    }

    console.debug('WebView message', msg);

    switch (msg.action) {
      case 'FIRST_LAYER_READY':
        setReady(true);
        break;
      case 'ENABLE_SCROLL_ON_PROPERTY':
      case 'DISABLE_SCROLL_ON_PROPERTY':
        // ignore these messages
        break;
      case 'GO_TO':
        switch (msg.payload?.options?.page) {
          case 'login':
          case 'signup':
            eventHandler.contentpass(
              msg.payload?.options?.page as 'login' | 'signup'
            );
            break;
          default:
            console.warn(
              'WebView message with unknown page',
              msg.payload?.options?.page,
              msg
            );
            break;
        }
        break;
      case 'ACCEPT_ALL':
        eventHandler.acceptAll();
        break;
      case 'SHOW_CMP_TOOL':
        eventHandler.showSecondLayer('purpose');
        break;
      case 'SHOW_VENDOR_LIST_TOOL':
        eventHandler.showSecondLayer('vendor');
        break;
      case 'SEND_EVENT':
        if (Array.isArray(msg.payload)) {
          eventHandler.sendEvent(
            msg.payload[0],
            msg.payload[1],
            msg.payload[2]
          );
        } else {
          console.warn('WebView message with unknown payload', msg.payload);
        }
        break;
      default:
        console.warn('WebView message with unknown action', msg.action, msg);
        break;
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: firstLayerUrl }}
        style={[styles.webview, !ready && { opacity: 0 }]}
        originWhitelist={['*']}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={GLUE_CODE_JS}
        onMessage={(event) => {
          handleMessage(event);
        }}
        onShouldStartLoadWithRequest={(request) => {
          console.debug('WebView request', request.url);
          return true;
        }}
        onLoadStart={() => {
          console.debug('WebView load start');
        }}
        onLoadEnd={() => {
          console.debug('WebView load end');
        }}
        onLoadProgress={(event) => {
          console.debug('WebView progress', event.nativeEvent.progress);
        }}
        onError={(event) => {
          console.debug('WebView error', event.nativeEvent);
        }}
        onHttpError={(event) => {
          console.debug('WebView HTTP error', event.nativeEvent);
        }}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.error}>
            <Text style={styles.errorText}>
              {`WebView error (${errorDomain}:${errorCode}) ${errorDesc}`}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
