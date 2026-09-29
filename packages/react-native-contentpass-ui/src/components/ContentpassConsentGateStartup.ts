// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export const UI_OPERATION_TIMEOUT_MS = 30_000;

// All timeouts below default to UI_OPERATION_TIMEOUT_MS. SDK integrators can
// override any subset of them, e.g. to give the initial layer page load more
// slack on a known-slow network, or to fail out of a stuck CMP faster.
export type ContentpassGateTimeouts = {
  /** `cmpAdapter.waitForInit()`. */
  cmpInitTimeoutMs?: number;
  /** `cmpAdapter.getRequiredPurposes()` / `getNumberOfVendors()`. */
  cmpMetadataTimeoutMs?: number;
  /** `cmpAdapter.hasFullConsent()` (initial snapshot only). */
  cmpConsentStatusTimeoutMs?: number;
  /** `sdk.authenticate()` when the user starts the Contentpass login/signup flow. */
  authenticateTimeoutMs?: number;
  /** `cmpAdapter.showSecondLayer()`. */
  secondLayerTimeoutMs?: number;
  /** Waiting for the Contentpass SDK to leave its initial `INITIALISING` state. */
  contentpassInitTimeoutMs?: number;
  /** Waiting for the layer's static HTML page to finish loading. */
  layerPageLoadTimeoutMs?: number;
  /** Waiting, once the layer page has loaded, for it to report ready. */
  layerReadyTimeoutMs?: number;
};

export type CmpMetadata = {
  purposesList: string[];
  vendorCount: number;
};

export function isConsentGateSatisfied(
  hasValidSubscription: boolean,
  hasFullConsent: boolean
): boolean {
  return hasValidSubscription || hasFullConsent;
}

export function withTimeout<T>(
  operation: Promise<T>,
  message: string,
  timeoutMs = UI_OPERATION_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);

    operation.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export async function loadCmpMetadata(
  cmpAdapter: CmpAdapter
): Promise<CmpMetadata> {
  const [purposesList, vendorCount] = await Promise.all([
    cmpAdapter.getRequiredPurposes(),
    cmpAdapter.getNumberOfVendors(),
  ]);

  return { purposesList, vendorCount };
}

export function observeCmpConsentStatus(
  cmpAdapter: CmpAdapter,
  onStatus: (hasFullConsent: boolean) => void,
  onError: (error: unknown) => void,
  timeoutMs = UI_OPERATION_TIMEOUT_MS
): () => void {
  let active = true;
  let statusRevision = 0;
  const initialStatusRevision = statusRevision;
  const initialStatusTimeout = setTimeout(() => {
    if (active && statusRevision === initialStatusRevision) {
      statusRevision += 1;
      onError(new Error('Timed out while loading initial CMP consent status'));
    }
  }, timeoutMs);
  const unsubscribe = cmpAdapter.onConsentStatusChange((hasFullConsent) => {
    statusRevision += 1;
    clearTimeout(initialStatusTimeout);
    if (active) {
      onStatus(hasFullConsent);
    }
  });

  cmpAdapter
    .hasFullConsent()
    .then((hasFullConsent) => {
      clearTimeout(initialStatusTimeout);
      if (active && statusRevision === initialStatusRevision) {
        onStatus(hasFullConsent);
      }
    })
    .catch((error) => {
      clearTimeout(initialStatusTimeout);
      if (active && statusRevision === initialStatusRevision) {
        onError(error);
      }
    });

  return () => {
    active = false;
    clearTimeout(initialStatusTimeout);
    unsubscribe?.();
  };
}
