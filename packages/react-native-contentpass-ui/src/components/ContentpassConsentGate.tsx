import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import {
  ContentpassStateType,
  useContentpassSdk,
} from '@contentpass/react-native-contentpass';
import type {
  CmpAdapter,
  ContentpassConfig,
  ContentpassState,
} from '@contentpass/react-native-contentpass';
import ContentpassLayer from './ContentpassLayer';
import type { ContentpassLayerEvents } from './ContentpassLayerEvents';
import {
  isConsentGateSatisfied,
  loadCmpMetadata,
  observeCmpConsentStatus,
  type CmpMetadata,
  type ContentpassGateTimeouts,
  UI_OPERATION_TIMEOUT_MS,
  withTimeout,
} from './ContentpassConsentGateStartup';
import {
  isConsentGateWaitingForAuth,
  shouldRecoverFromErrorOnAppState,
} from './ContentpassConsentGateRecovery';

type ContentpassConsentGateProps = {
  children: React.ReactNode;
  cmpAdapter: CmpAdapter;
  contentpassConfig: ContentpassConfig;
  hideAppWhenVisible?: boolean;
  locale?: string;
  onVisibilityChange?: (visible: boolean) => void;
  timeouts?: ContentpassGateTimeouts;
};

export default function ContentpassConsentGate({
  children,
  cmpAdapter,
  contentpassConfig,
  hideAppWhenVisible = true,
  locale,
  onVisibilityChange,
  timeouts = {},
}: ContentpassConsentGateProps) {
  const {
    cmpInitTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    cmpMetadataTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    cmpConsentStatusTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    authenticateTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    secondLayerTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    contentpassInitTimeoutMs = UI_OPERATION_TIMEOUT_MS,
    layerPageLoadTimeoutMs,
    layerReadyTimeoutMs,
  } = timeouts;
  const sdk = useContentpassSdk();
  const [cmpReady, setCmpReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cpAuthState, setCpAuthState] = useState<ContentpassState | null>(null);
  const [isShowingSecondLayer, setIsShowingSecondLayer] = useState(false);
  const [isShowingContentpass, setIsShowingContentpass] = useState(false);

  const [consentResolved, setConsentResolved] = useState(false);
  const [failedOpen, setFailedOpen] = useState(false);
  const [cmpMetadata, setCmpMetadata] = useState<
    (CmpMetadata & { adapter: CmpAdapter }) | null
  >(null);
  const currentCmpMetadata =
    cmpMetadata?.adapter === cmpAdapter ? cmpMetadata : null;
  const [cmpConsentStatus, setCmpConsentStatus] = useState<{
    adapter: CmpAdapter;
    hasFullConsent: boolean;
  } | null>(null);
  const currentCmpConsentStatus =
    cmpConsentStatus?.adapter === cmpAdapter ? cmpConsentStatus : null;
  const failOpen = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    setFailedOpen(true);
  }, []);
  const handleLayerFailure = useCallback(
    (error: unknown) => {
      failOpen('Failed to initialize Contentpass layer', error);
    },
    [failOpen]
  );

  const layerEvents = useMemo(() => {
    return {
      acceptAll: async () => {
        try {
          console.debug(
            '[ContentpassConsentGate::acceptAll] forwarding to CMP'
          );
          await cmpAdapter.acceptAll();
          console.debug(
            '[ContentpassConsentGate::acceptAll] CMP action resolved'
          );
        } catch (error) {
          console.error('Failed to accept all in CMP', error);
        }
      },
      contentpass: async (route: 'login' | 'signup') => {
        try {
          setIsShowingContentpass(true);
          await withTimeout(
            sdk.authenticate(route),
            'Timed out while authenticating Contentpass',
            authenticateTimeoutMs
          );
        } catch (error) {
          failOpen('Failed to authenticate Contentpass', error);
          sdk.recoverFromError();
        } finally {
          setIsShowingContentpass(false);
        }
      },
      showSecondLayer: async (view: 'vendor' | 'purpose') => {
        setIsShowingSecondLayer(true);
        try {
          await withTimeout(
            cmpAdapter.showSecondLayer(view),
            'Timed out while showing the CMP second layer',
            secondLayerTimeoutMs
          );
        } catch (error) {
          failOpen('Failed to show second layer in CMP', error);
        } finally {
          setIsShowingSecondLayer(false);
        }
      },
      sendEvent: (
        eventCategory: string,
        eventAction: string,
        eventLabel: string
      ) => {
        sdk.event(eventCategory, eventAction, eventLabel);
      },
    } as ContentpassLayerEvents;
  }, [sdk, cmpAdapter, failOpen, authenticateTimeoutMs, secondLayerTimeoutMs]);

  // Wait for the CMP to be ready
  useEffect(() => {
    if (cmpReady) {
      return;
    }

    let active = true;
    withTimeout(
      cmpAdapter.waitForInit(),
      'Timed out while waiting for CMP initialization',
      cmpInitTimeoutMs
    )
      .then(() => {
        if (active) {
          setCmpReady(true);
        }
      })
      .catch((error) => {
        if (active) {
          failOpen('Failed to initialize CMP', error);
        }
      });

    return () => {
      active = false;
    };
  }, [cmpReady, cmpAdapter, failOpen, cmpInitTimeoutMs]);

  // Listen for consent status changes
  useEffect(() => {
    if (!cmpReady) {
      return;
    }

    let active = true;
    const stopObservingConsent = observeCmpConsentStatus(
      cmpAdapter,
      (hasFullConsent) => {
        console.debug('[ContentpassConsentGate::onConsentStatusChange]', {
          fullConsent: hasFullConsent,
        });
        setCmpConsentStatus({ adapter: cmpAdapter, hasFullConsent });
      },
      (error) => {
        console.error('Failed to load initial CMP consent status', error);
        setCmpConsentStatus({ adapter: cmpAdapter, hasFullConsent: false });
      },
      cmpConsentStatusTimeoutMs
    );
    withTimeout(
      loadCmpMetadata(cmpAdapter),
      'Timed out while loading CMP metadata',
      cmpMetadataTimeoutMs
    )
      .then((metadata) => {
        if (active) {
          setCmpMetadata({ ...metadata, adapter: cmpAdapter });
        }
      })
      .catch((error) => {
        if (active) {
          failOpen('Failed to load CMP metadata', error);
        }
      });

    return () => {
      active = false;
      console.debug('[ContentpassConsentGate::onConsentStatusChange] cleanup');
      stopObservingConsent();
    };
  }, [
    cmpReady,
    cmpAdapter,
    failOpen,
    cmpConsentStatusTimeoutMs,
    cmpMetadataTimeoutMs,
  ]);

  // Monitor the contentpass auth state
  useEffect(() => {
    const observer = (state: ContentpassState) => {
      setCpAuthState(state);
    };
    sdk.registerObserver(observer);

    return () => {
      sdk.unregisterObserver(observer);
    };
  }, [sdk]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (shouldRecoverFromErrorOnAppState(nextState, cpAuthState?.state)) {
        sdk.recoverFromError();
      }
    });

    return () => subscription.remove();
  }, [cpAuthState?.state, sdk]);

  useEffect(() => {
    if (cpAuthState?.state === ContentpassStateType.ERROR) {
      failOpen('Contentpass initialization failed', cpAuthState.error);
      return;
    }

    if (
      cpAuthState &&
      cpAuthState.state !== ContentpassStateType.INITIALISING
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      failOpen('Timed out while initializing Contentpass');
    }, contentpassInitTimeoutMs);

    return () => clearTimeout(timeout);
  }, [cpAuthState, failOpen, contentpassInitTimeoutMs]);

  // Policy for setting the visibility of the consent layer
  useEffect(() => {
    if (
      !cmpReady ||
      !currentCmpMetadata ||
      !currentCmpConsentStatus ||
      !cpAuthState ||
      isConsentGateWaitingForAuth(cpAuthState.state)
    ) {
      return;
    }

    // FIXME do neither show app nor show the layer while
    //       second layer or contentpass funnel are shown
    if (isShowingSecondLayer || isShowingContentpass) {
      setIsVisible(false);
      return;
    }

    const hasValidSubscription =
      cpAuthState.state === ContentpassStateType.AUTHENTICATED &&
      cpAuthState.hasValidSubscription;
    const isFine = isConsentGateSatisfied(
      hasValidSubscription,
      currentCmpConsentStatus.hasFullConsent
    );
    const visible = !isFine;
    console.debug('[ContentpassConsentGate::visibility]', {
      cmpReady,
      contentpassState: cpAuthState.state,
      hasFullConsent: currentCmpConsentStatus.hasFullConsent,
      isShowingContentpass,
      isShowingSecondLayer,
      visible,
    });
    if (visible !== isVisible) {
      onVisibilityChange?.(visible);
    }
    setIsVisible(visible);
    setConsentResolved(true);
  }, [
    cmpReady,
    currentCmpMetadata,
    currentCmpConsentStatus,
    cpAuthState,
    isShowingContentpass,
    isShowingSecondLayer,
    isVisible,
    onVisibilityChange,
  ]);

  if (failedOpen) {
    return <>{children}</>;
  }

  if (!consentResolved || isShowingContentpass || isShowingSecondLayer) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isVisible) {
    return <>{children}</>;
  }

  function renderContentpassLayer() {
    return (
      <ContentpassLayer
        eventHandler={layerEvents}
        baseUrl={contentpassConfig.apiUrl}
        instanceId={sdk.instanceId}
        planId={contentpassConfig.planId}
        propertyId={contentpassConfig.propertyId}
        purposesList={currentCmpMetadata?.purposesList ?? []}
        vendorCount={currentCmpMetadata?.vendorCount ?? 0}
        locale={locale}
        onFailure={handleLayerFailure}
        pageLoadTimeoutMs={layerPageLoadTimeoutMs}
        readyTimeoutMs={layerReadyTimeoutMs}
      />
    );
  }

  if (hideAppWhenVisible) {
    return renderContentpassLayer();
  }

  return (
    <View style={styles.overlayContainer}>
      {children}
      <View style={styles.overlay}>{renderContentpassLayer()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
