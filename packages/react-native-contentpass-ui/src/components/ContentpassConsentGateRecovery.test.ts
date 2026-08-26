// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { ContentpassStateType } from '@contentpass/react-native-contentpass';
import {
  isConsentGateWaitingForAuth,
  shouldRecoverFromErrorOnAppState,
} from './ContentpassConsentGateRecovery';

describe('isConsentGateWaitingForAuth', () => {
  it('only waits while the SDK is initialising', () => {
    expect(
      isConsentGateWaitingForAuth('INITIALISING' as ContentpassStateType)
    ).toBe(true);
    expect(isConsentGateWaitingForAuth('ERROR' as ContentpassStateType)).toBe(
      false
    );
    expect(
      isConsentGateWaitingForAuth('UNAUTHENTICATED' as ContentpassStateType)
    ).toBe(false);
    expect(
      isConsentGateWaitingForAuth('AUTHENTICATED' as ContentpassStateType)
    ).toBe(false);
  });
});

describe('shouldRecoverFromErrorOnAppState', () => {
  it('recovers from ERROR when the app returns to the foreground', () => {
    expect(
      shouldRecoverFromErrorOnAppState(
        'active',
        'ERROR' as ContentpassStateType
      )
    ).toBe(true);
  });

  it('does not recover for other states or backgrounding', () => {
    expect(
      shouldRecoverFromErrorOnAppState(
        'background',
        'ERROR' as ContentpassStateType
      )
    ).toBe(false);
    expect(
      shouldRecoverFromErrorOnAppState(
        'active',
        'UNAUTHENTICATED' as ContentpassStateType
      )
    ).toBe(false);
    expect(shouldRecoverFromErrorOnAppState('active')).toBe(false);
  });
});
