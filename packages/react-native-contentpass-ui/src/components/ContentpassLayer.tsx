import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ContentpassLayerEvents } from './ContentpassLayerEvents';
import buildFirstLayerUrl from './buildFirstLayerUrl';
import { getAndroidOverlayNavigationBarInset } from './ContentpassLayerAndroidInset';
import {
  canReachLayerUrl,
  getLayerLoadErrorCopy,
  LAYER_REACHABILITY_POLL_MS,
  shouldRetryLayerLoadOnAppState,
} from './ContentpassLayerLoadRecovery';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

const MESSAGE_PROTOCOL = 'contentpass-first-layer';
const POPUP_URL_PROTOCOLS = new Set(['http:', 'https:']);

let firstLayerMountNonce = 0;

type LayerReadyAction =
  | 'first-layer-ready'
  | 'load-started'
  | 'load-ended'
  | 'url-changed';

export const LOAD_END_READY_FALLBACK_MS = 500;

function useAndroidOverlayNavigationBarInset(): number {
  const window = useWindowDimensions();

  if (Platform.OS !== 'android') {
    return 0;
  }

  return getAndroidOverlayNavigationBarInset({
    windowHeight: window.height,
    screenHeight: Dimensions.get('screen').height,
    statusBarHeight: StatusBar.currentHeight ?? 0,
  });
}

export function layerReadyReducer(
  ready: boolean,
  action: LayerReadyAction
): boolean {
  switch (action) {
    case 'first-layer-ready':
    case 'load-ended':
      return true;
    case 'url-changed':
      return false;
    case 'load-started':
      return ready;
  }
}

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

export const EARLY_INJECT_JS = `
  (function () {
    var pendingMessages = window.__cpRnPendingMessages;
    if (!pendingMessages) {
      pendingMessages = [];
      window.__cpRnPendingMessages = pendingMessages;
    }

    function postToReactNative(message) {
      var bridge = window.ReactNativeWebView;

      if (!bridge || typeof bridge.postMessage !== 'function') {
        return false;
      }

      try {
        bridge.postMessage(message);
        return true;
      } catch (error) {
        return false;
      }
    }

    function wrapPostMessage(target) {
      if (!target || typeof target.postMessage !== 'function') {
        return;
      }

      if (target.postMessage.__cpRnWrapped) {
        return;
      }

      var originalPostMessage = target.postMessage;
      var wrapped = function (data) {
        try {
          var message =
            typeof data === 'string' ? data : JSON.stringify(data);

          if (
            typeof message === 'string' &&
            !postToReactNative(message)
          ) {
            pendingMessages.push(message);
          }
        } catch (error) {}

        if (originalPostMessage) {
          originalPostMessage.apply(target, arguments);
        }
      };
      wrapped.__cpRnWrapped = true;

      try {
        target.postMessage = wrapped;
      } catch (error) {}
    }

    wrapPostMessage(window);
    try {
      if (window.parent) {
        wrapPostMessage(window.parent);
      }
    } catch (error) {}

    if (!window.__cpRnBridgeInterval) {
      window.__cpRnBridgeInterval = setInterval(function () {
        while (
          pendingMessages.length > 0 &&
          postToReactNative(pendingMessages[0])
        ) {
          pendingMessages.shift();
        }

        if (
          pendingMessages.length === 0 &&
          window.ReactNativeWebView &&
          typeof window.ReactNativeWebView.postMessage === 'function'
        ) {
          clearInterval(window.__cpRnBridgeInterval);
          window.__cpRnBridgeInterval = null;
        }
      }, 10);
    }

    function injectStyle() {
      if (window.__cpRnStyleInjected) {
        return;
      }

      var parent = document.head || document.documentElement;

      if (!parent) {
        return;
      }

      var style = document.createElement('style');
      style.textContent = '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; } main, .backdrop { visibility: visible !important; transform: none !important; }';
      parent.appendChild(style);
      window.__cpRnStyleInjected = true;
    }

    if (document.head || document.documentElement) {
      injectStyle();
    } else if (!window.__cpRnStyleListener) {
      window.__cpRnStyleListener = true;
      document.addEventListener('DOMContentLoaded', injectStyle, false);
    }
  })();
  true;
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
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
  const androidOverlayNavigationBarInset =
    useAndroidOverlayNavigationBarInset();
  const cacheNonce = useState(() => String(++firstLayerMountNonce))[0];
  const firstLayerUrl = useMemo(() => {
    return buildFirstLayerUrl({
      baseUrl,
      propertyId,
      planId,
      purposesList,
      vendorCount,
      locale,
      cacheNonce,
    });
  }, [
    baseUrl,
    planId,
    propertyId,
    purposesList,
    vendorCount,
    locale,
    cacheNonce,
  ]);

  const [ready, updateReady] = useReducer(layerReadyReducer, false);
  const [layerUrl, setLayerUrl] = useState(firstLayerUrl);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const errorCopy = getLayerLoadErrorCopy(locale);
  const loadEndFallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearLoadEndFallback = useCallback(() => {
    if (loadEndFallbackTimer.current) {
      clearTimeout(loadEndFallbackTimer.current);
      loadEndFallbackTimer.current = null;
    }
  }, []);

  useEffect(() => clearLoadEndFallback, [clearLoadEndFallback]);

  const markUrlChanged = useCallback(() => {
    clearLoadEndFallback();
    updateReady('url-changed');
  }, [clearLoadEndFallback]);

  const retryLoad = useCallback(() => {
    setHasLoadError(false);
    markUrlChanged();
    setReloadNonce((nonce) => nonce + 1);
  }, [markUrlChanged]);

  useEffect(() => {
    setLayerUrl(firstLayerUrl);
    setHasLoadError(false);
    markUrlChanged();
  }, [firstLayerUrl, markUrlChanged]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (shouldRetryLayerLoadOnAppState(nextState, hasLoadError)) {
        retryLoad();
      }
    });

    return () => subscription.remove();
  }, [hasLoadError, retryLoad]);

  useEffect(() => {
    if (!hasLoadError) {
      return;
    }

    let cancelled = false;
    const poll = async () => {
      const reachable = await canReachLayerUrl(firstLayerUrl);
      if (!cancelled && reachable) {
        retryLoad();
      }
    };
    const timer = setInterval(() => {
      poll();
    }, LAYER_REACHABILITY_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [firstLayerUrl, hasLoadError, retryLoad]);

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

  const loadLayerUrl = useCallback(
    (url: URL) => {
      markUrlChanged();
      setLayerUrl(url.toString());
    },
    [markUrlChanged]
  );

  const scheduleLoadEndReadyFallback = useCallback(
    (loadedUrl: string) => {
      if (!loadedUrl) {
        return;
      }

      try {
        const loaded = new URL(loadedUrl, firstLayerUrl);
        if (loaded.protocol === 'about:' || !isFirstLayerUrl(loaded)) {
          return;
        }
      } catch {
        return;
      }

      clearLoadEndFallback();
      loadEndFallbackTimer.current = setTimeout(() => {
        loadEndFallbackTimer.current = null;
        updateReady('load-ended');
      }, LOAD_END_READY_FALLBACK_MS);
    },
    [clearLoadEndFallback, firstLayerUrl, isFirstLayerUrl]
  );

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
        clearLoadEndFallback();
        updateReady('first-layer-ready');
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
    <View
      style={[
        styles.container,
        androidOverlayNavigationBarInset > 0 && {
          paddingBottom: androidOverlayNavigationBarInset,
        },
      ]}
    >
      <WebView
        key={reloadNonce}
        source={{ uri: layerUrl }}
        style={[styles.webview, !ready && { opacity: 0 }]}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        automaticallyAdjustContentInsets={false}
        cacheEnabled={false}
        injectedJavaScriptBeforeContentLoaded={EARLY_INJECT_JS}
        injectedJavaScript={EARLY_INJECT_JS}
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
          setHasLoadError(false);
          updateReady('load-started');
        }}
        onLoadEnd={(event) => {
          console.debug('WebView load end');
          scheduleLoadEndReadyFallback(event.nativeEvent.url);
        }}
        onLoadProgress={(event) => {
          console.debug('WebView progress', event.nativeEvent.progress);
        }}
        onError={(event) => {
          console.debug('WebView error', event.nativeEvent);
          setHasLoadError(true);
        }}
        onHttpError={(event) => {
          console.debug('WebView HTTP error', event.nativeEvent);
        }}
        renderError={() => (
          <View style={styles.error}>
            <Text style={styles.errorText}>{errorCopy.message}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={errorCopy.retryLabel}
              onPress={retryLoad}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>{errorCopy.retryLabel}</Text>
            </Pressable>
          </View>
        )}
      />
      {!ready && !hasLoadError && (
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
