import type {
  ContentpassState,
  ErrorState,
  AuthenticatedState,
  InitialisingState,
  UnauthenticatedState,
} from './types/ContentpassState';

import { ContentpassStateType } from './types/ContentpassState';

import type { ContentpassConfig } from './types/ContentpassConfig';
import type { CmpAdapter } from './types/CmpAdapter';

const FOOBAR = 123;

export { FOOBAR };

import {
  type default as Contentpass,
  type ContentpassObserver,
} from './Contentpass';

import { ContentpassSdkProvider } from './sdkContext/ContentpassSdkProvider';

import { default as useContentpassSdk } from './sdkContext/useContentpassSdk';

export { ContentpassStateType, ContentpassSdkProvider, useContentpassSdk };
export type {
  Contentpass,
  ContentpassState,
  ErrorState,
  AuthenticatedState,
  InitialisingState,
  UnauthenticatedState,
  ContentpassConfig,
  CmpAdapter,
  ContentpassObserver,
};
