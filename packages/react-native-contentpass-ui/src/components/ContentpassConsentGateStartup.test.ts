// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import { loadCmpMetadata } from './ContentpassConsentGateStartup';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe('loadCmpMetadata', () => {
  it('waits until purposes and vendor count are both available', async () => {
    const purposes = deferred<string[]>();
    const vendors = deferred<number>();
    const cmpAdapter = {
      getRequiredPurposes: jest.fn(() => purposes.promise),
      getNumberOfVendors: jest.fn(() => vendors.promise),
    } as unknown as CmpAdapter;
    const metadata = loadCmpMetadata(cmpAdapter);
    const onLoaded = jest.fn();
    metadata.then(onLoaded);

    purposes.resolve(['storage', 'analytics']);
    await Promise.resolve();
    expect(onLoaded).not.toHaveBeenCalled();

    vendors.resolve(42);

    await expect(metadata).resolves.toEqual({
      purposesList: ['storage', 'analytics'],
      vendorCount: 42,
    });
  });
});
