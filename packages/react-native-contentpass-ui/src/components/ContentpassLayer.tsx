import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ContentpassLayerEvents } from './ContentpassLayerEvents';
import buildFirstLayerUrl from './buildFirstLayerUrl';
import { useCallback, useEffect, useMemo, useState } from 'react';

const MESSAGE_PROTOCOL = 'contentpass-first-layer';
const POPUP_URL_PROTOCOLS = new Set(['http:', 'https:']);

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '');
}

function isSameOrNestedPath(pathname: string, basePathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedBasePathname = normalizePathname(basePathname);

  return (
    normalizedPathname === normalizedBasePathname ||
    normalizedPathname.startsWith(`${normalizedBasePathname}/`)
  );
}

const EARLY_INJECT_JS = `
  (function () {
    var style = document.createElement('style');
    style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; } main, .backdrop { visibility: visible !important; transform: none !important; }';
    (document.head || document.documentElement).appendChild(style);

    var originalPostMessage = window.postMessage;
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
    backgroundColor: '#fff',
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
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  popupClose: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popupCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  popupWebview: {
    flex: 1,
  },
});

export default function ContentpassLayer({
  baseUrl,
  eventHandler,
  instanceId,
  planId,
  propertyId,
  purposesList,
  vendorCount,
  locale,
}: {
  baseUrl: string;
  eventHandler: ContentpassLayerEvents;
  instanceId: string;
  planId: string;
  propertyId: string;
  purposesList: string[];
  vendorCount: number;
  locale?: string;
}) {
  const firstLayerUrl = useMemo(() => {
    return buildFirstLayerUrl({
      baseUrl,
      propertyId,
      planId,
      purposesList,
      vendorCount,
      locale,
    });
  }, [baseUrl, planId, propertyId, purposesList, vendorCount, locale]);

  const [ready, setReady] = useState(false);
  const [layerUrl, setLayerUrl] = useState(firstLayerUrl);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);

  useEffect(() => {
    setLayerUrl(firstLayerUrl);
    setReady(false);
  }, [firstLayerUrl]);

  const closePopup = useCallback(() => setPopupUrl(null), []);

  const isFirstLayerUrl = useCallback(
    (url: URL) => {
      const firstLayer = new URL(firstLayerUrl);

      return (
        url.origin === firstLayer.origin &&
        isSameOrNestedPath(url.pathname, firstLayer.pathname)
      );
    },
    [firstLayerUrl]
  );

  const loadLayerUrl = useCallback((url: URL) => {
    setReady(false);
    setLayerUrl(url.toString());
  }, []);

  const openPopup = useCallback(
    (url: unknown) => {
      if (typeof url !== 'string' || url.length === 0) {
        console.warn('Unable to open popup with unknown URL', url);
        return;
      }

      try {
        const popupUrl = new URL(url, baseUrl);

        if (!POPUP_URL_PROTOCOLS.has(popupUrl.protocol)) {
          console.warn('Unable to open popup with unsupported URL', url);
          return;
        }

        setPopupUrl(popupUrl.toString());
      } catch (error) {
        console.warn('Unable to open popup with invalid URL', url, error);
      }
    },
    [baseUrl]
  );

  function buildFaqUrl(): string {
    return `${baseUrl}/auth/login?instanceId=${encodeURIComponent(instanceId)}&propertyId=${encodeURIComponent(propertyId)}&planId=${encodeURIComponent(planId)}&route=faq`;
  }

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
          case 'faq':
            openPopup(buildFaqUrl());
            break;
          case 'url':
            openPopup(msg.payload?.options?.url);
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
        source={{ uri: layerUrl }}
        style={[styles.webview, !ready && { opacity: 0 }]}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        automaticallyAdjustContentInsets={false}
        injectedJavaScriptBeforeContentLoaded={EARLY_INJECT_JS}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          handleMessage(event);
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (request.isTopFrame === false) {
            return true;
          }

          try {
            const requested = new URL(request.url, firstLayerUrl);
            const allowed = isFirstLayerUrl(requested);

            console.debug('WebView request', request.url, {
              allowed,
              firstLayerUrl,
              layerUrl,
              requestedUrl: requested.toString(),
            });

            if (!allowed) {
              openPopup(requested.toString());
            }

            return allowed;
          } catch (error) {
            console.warn(
              'Unable to handle WebView request',
              request.url,
              error
            );
            return false;
          }
        }}
        onOpenWindow={(event) => {
          try {
            const targetUrl = new URL(
              event.nativeEvent.targetUrl,
              firstLayerUrl
            );

            if (isFirstLayerUrl(targetUrl)) {
              loadLayerUrl(targetUrl);
              return;
            }

            openPopup(targetUrl.toString());
          } catch (error) {
            console.warn(
              'Unable to handle WebView open window request',
              event.nativeEvent.targetUrl,
              error
            );
          }
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
      {!ready && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      <Modal
        visible={popupUrl !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePopup}
      >
        <View style={styles.popupContainer}>
          <View style={styles.popupHeader}>
            <Pressable onPress={closePopup} style={styles.popupClose}>
              <Text style={styles.popupCloseText}>Close</Text>
            </Pressable>
          </View>
          {popupUrl && (
            <WebView
              source={{ uri: popupUrl }}
              style={styles.popupWebview}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={(request) => {
                console.debug('WebView popup request', request.url);
                // Allow any request to load in the popup, otherwise
                // we would block redirects to external URLs.
                return true;
              }}
              onOpenWindow={(event) => {
                openPopup(event.nativeEvent.targetUrl);
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
