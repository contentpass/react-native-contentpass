// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export type CmpMetadata = {
  purposesList: string[];
  vendorCount: number;
};

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
  onError: (error: unknown) => void
): () => void {
  let active = true;
  let statusRevision = 0;
  const initialStatusRevision = statusRevision;
  const unsubscribe = cmpAdapter.onConsentStatusChange((hasFullConsent) => {
    statusRevision += 1;
    if (active) {
      onStatus(hasFullConsent);
    }
  });

  cmpAdapter
    .hasFullConsent()
    .then((hasFullConsent) => {
      if (active && statusRevision === initialStatusRevision) {
        onStatus(hasFullConsent);
      }
    })
    .catch((error) => {
      if (active && statusRevision === initialStatusRevision) {
        onError(error);
      }
    });

  return () => {
    active = false;
    unsubscribe?.();
  };
}
