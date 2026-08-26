// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { ContentpassStateType } from '@contentpass/react-native-contentpass';
import type { AppStateStatus } from 'react-native';

export function isConsentGateWaitingForAuth(
  state: ContentpassStateType
): boolean {
  return state === 'INITIALISING';
}

export function shouldRecoverFromErrorOnAppState(
  nextState: AppStateStatus,
  authState?: ContentpassStateType
): boolean {
  return nextState === 'active' && authState === 'ERROR';
}
