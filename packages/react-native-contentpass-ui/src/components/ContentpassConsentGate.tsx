import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

type ContentpassConsentGateProps = {
  children: React.ReactNode;
  cmpAdapter: CmpAdapter;
  contentpassConfig: ContentpassConfig;
  hideAppWhenVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
};

export default function ContentpassConsentGate({
  children,
  cmpAdapter,
  contentpassConfig,
  hideAppWhenVisible = true,
  onVisibilityChange,
}: ContentpassConsentGateProps) {
  const sdk = useContentpassSdk();
  const [cmpReady, setCmpReady] = useState(false);
  const [hasFullConsent, setHasFullConsent] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cpAuthState, setCpAuthState] = useState<ContentpassState | null>(null);
  const [isShowingSecondLayer, setIsShowingSecondLayer] = useState(false);
  const [isShowingContentpass, setIsShowingContentpass] = useState(false);

  const [purposesList, setPurposesList] = useState<string[]>([]);
  const [vendorCount, setVendorCount] = useState(0);

  const layerEvents = useMemo(() => {
    return {
      acceptAll: async () => {
        try {
          await cmpAdapter.acceptAll();
        } catch (error) {
          console.error('Failed to accept all in CMP', error);
        }
      },
      contentpass: async (route: 'login' | 'signup') => {
        try {
          setIsShowingContentpass(true);
          await sdk.authenticate(route);
        } catch (error) {
          console.error('Failed to authenticate Contentpass', error);
          sdk.recoverFromError();
        } finally {
          setIsShowingContentpass(false);
        }
      },
      showSecondLayer: async (view: 'vendor' | 'purpose') => {
        setIsShowingSecondLayer(true);
        try {
          await cmpAdapter.showSecondLayer(view);
        } catch (error) {
          console.error('Failed to show second layer in CMP', error);
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
  }, [sdk, cmpAdapter]);

  // Wait for the CMP to be ready
  useEffect(() => {
    if (cmpReady) {
      return;
    }

    cmpAdapter?.waitForInit?.().then(() => {
      setCmpReady(true);
    });
  }, [cmpReady, cmpAdapter]);

  // Listen for consent status changes
  useEffect(() => {
    if (!cmpReady) {
      return;
    }

    cmpAdapter?.onConsentStatusChange?.((v: boolean) => setHasFullConsent(v));
    cmpAdapter.getRequiredPurposes().then((v: string[]) => setPurposesList(v));
    cmpAdapter.getNumberOfVendors().then((v: number) => setVendorCount(v));
  }, [cmpReady, cmpAdapter, onVisibilityChange, isVisible]);

  // Monitor the contentpass auth state
  useEffect(() => {
    sdk.registerObserver((state) => {
      setCpAuthState(state);
    });
  }, [sdk]);

  // Policy for setting the visibility of the consent layer
  useEffect(() => {
    const invalidStates = [
      ContentpassStateType.INITIALISING,
      ContentpassStateType.ERROR,
    ];
    if (
      !cmpReady ||
      !cpAuthState ||
      invalidStates.includes(cpAuthState.state)
    ) {
      return;
    }

    // FIXME do neither show app nor show the layer while
    //       second layer or contentpass funnel are shown
    if (isShowingSecondLayer || isShowingContentpass) {
      setIsVisible(false);
      return;
    }

    const isFine =
      cpAuthState.state === ContentpassStateType.AUTHENTICATED ||
      hasFullConsent;
    const visible = !isFine;
    console.log(
      '>>> Changing visibility to',
      visible,
      isFine,
      cpAuthState.state,
      hasFullConsent
    );
    if (visible !== isVisible) {
      onVisibilityChange?.(visible);
    }
    setIsVisible(visible);
  }, [
    cmpReady,
    cpAuthState,
    hasFullConsent,
    isShowingContentpass,
    isShowingSecondLayer,
    isVisible,
    onVisibilityChange,
  ]);

  if (!isVisible) {
    return <>{children}</>;
  }

  function renderContentpassLayer() {
    return (
      <ContentpassLayer
        eventHandler={layerEvents}
        baseUrl={contentpassConfig.apiUrl}
        planId={contentpassConfig.planId}
        propertyId={contentpassConfig.propertyId}
        purposesList={purposesList}
        vendorCount={vendorCount}
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
  overlayContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
