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
