// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export const UI_OPERATION_TIMEOUT_MS = 30_000;

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
