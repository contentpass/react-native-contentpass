/* istanbul ignore file */

export enum ContentpassStateType {
  INITIALISING = 'INITIALISING',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR',
}

export type InitialisingState = {
  state: ContentpassStateType.INITIALISING;
  hasValidSubscription?: never;
  error?: never;
};

export type UnauthenticatedState = {
  state: ContentpassStateType.UNAUTHENTICATED;
  hasValidSubscription: false;
  error?: never;
};

export type AuthenticatedState = {
  state: ContentpassStateType.AUTHENTICATED;
  hasValidSubscription: boolean;
  error?: never;
};

export type ErrorState = {
  state: ContentpassStateType.ERROR;
  hasValidSubscription?: never;
  error: string;
};

export type ContentpassState =
  | InitialisingState
  | UnauthenticatedState
  | AuthenticatedState
  | ErrorState;
