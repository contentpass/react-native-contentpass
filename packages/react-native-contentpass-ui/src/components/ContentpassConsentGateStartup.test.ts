// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { CmpAdapter } from '@contentpass/react-native-contentpass';
import {
  isConsentGateSatisfied,
  loadCmpMetadata,
  observeCmpConsentStatus,
  withTimeout,
} from './ContentpassConsentGateStartup';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe('isConsentGateSatisfied', () => {
  it('requires either a valid subscription or full consent', () => {
    expect(isConsentGateSatisfied(false, false)).toBe(false);
    expect(isConsentGateSatisfied(true, false)).toBe(true);
    expect(isConsentGateSatisfied(false, true)).toBe(true);
  });
});

describe('withTimeout', () => {
  it('rejects operations that do not settle in time', async () => {
    jest.useFakeTimers();
    try {
      const operation = deferred<void>();
      const result = withTimeout(operation.promise, 'Timed out', 100);

      jest.advanceTimersByTime(100);

      await expect(result).rejects.toThrow('Timed out');
    } finally {
      jest.useRealTimers();
    }
  });
});

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

describe('observeCmpConsentStatus', () => {
  it('reports the initial consent snapshot before the gate resolves', async () => {
    const initialConsent = deferred<boolean>();
    const onStatus = jest.fn();
    const cmpAdapter = {
      hasFullConsent: jest.fn(() => initialConsent.promise),
      onConsentStatusChange: jest.fn(),
    } as unknown as CmpAdapter;

    observeCmpConsentStatus(cmpAdapter, onStatus, jest.fn());

    expect(onStatus).not.toHaveBeenCalled();

    initialConsent.resolve(true);
    await Promise.resolve();

    expect(onStatus).toHaveBeenCalledWith(true);
  });

  it('ignores an initial snapshot superseded by a consent event', async () => {
    const initialConsent = deferred<boolean>();
    const onStatus = jest.fn();
    const unsubscribe = jest.fn();
    let emitConsentStatus!: (hasFullConsent: boolean) => void;
    const cmpAdapter = {
      hasFullConsent: jest.fn(() => initialConsent.promise),
      onConsentStatusChange: jest.fn((listener) => {
        emitConsentStatus = listener;
        return unsubscribe;
      }),
    } as unknown as CmpAdapter;
    const stopObserving = observeCmpConsentStatus(
      cmpAdapter,
      onStatus,
      jest.fn()
    );

    emitConsentStatus(false);
    initialConsent.resolve(true);
    await Promise.resolve();

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith(false);

    stopObserving();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('reports an error when no initial consent status arrives', () => {
    jest.useFakeTimers();
    try {
      const onError = jest.fn();
      const cmpAdapter = {
        hasFullConsent: jest.fn(() => new Promise<boolean>(() => {})),
        onConsentStatusChange: jest.fn(),
      } as unknown as CmpAdapter;

      observeCmpConsentStatus(cmpAdapter, jest.fn(), onError, 100);
      jest.advanceTimersByTime(100);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Timed out while loading initial CMP consent status',
        })
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
