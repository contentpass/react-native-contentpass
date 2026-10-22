// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import type {
  CmpAdapter,
  ContentpassConfig,
  ContentpassState,
} from '@contentpass/react-native-contentpass';
import ContentpassConsentGate from './ContentpassConsentGate';
import { SDK_VERSION } from './sdkVersion';

let mockLayerFailure: ((error: unknown) => void) | null = null;

jest.mock('./ContentpassLayer', () => ({
  __esModule: true,
  default: ({ onFailure }: { onFailure: (error: unknown) => void }) => {
    mockLayerFailure = onFailure;
    return null;
  },
}));

const mockSdk = {
  instanceId: 'instance',
  authState: null as ContentpassState | null,
  authenticate: jest.fn(async () => {}),
  event: jest.fn(async () => {}),
  recoverFromError: jest.fn(async () => {}),
  registerObserver: jest.fn((observer: (state: ContentpassState) => void) => {
    if (mockSdk.authState) {
      observer(mockSdk.authState);
    }
  }),
  reportError: jest.fn(),
  unregisterObserver: jest.fn(),
};

// The SDK package resolves to its build output, which tests run without.
jest.mock(
  '@contentpass/react-native-contentpass',
  () => ({
    ContentpassStateType: {
      INITIALISING: 'INITIALISING',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      AUTHENTICATED: 'AUTHENTICATED',
      ERROR: 'ERROR',
    },
    useContentpassSdk: () => mockSdk,
  }),
  { virtual: true }
);

const contentpassConfig = {
  propertyId: 'property',
  planId: 'plan',
  issuer: 'https://issuer.test',
  apiUrl: 'https://example.test',
  redirectUrl: 'test://oauth',
} as ContentpassConfig;

function createCmpAdapter() {
  let consentStatusCallback: ((fullConsent: boolean) => void) | null = null;
  const cmpAdapter: CmpAdapter = {
    acceptAll: jest.fn(async () => {}),
    denyAll: jest.fn(async () => {}),
    getNumberOfVendors: jest.fn(async () => 100),
    getRequiredPurposes: jest.fn(async () => ['1', '2']),
    hasFullConsent: jest.fn(async () => false),
    onConsentStatusChange: jest.fn((callback) => {
      consentStatusCallback = callback;
      return () => {};
    }),
    showSecondLayer: jest.fn(async () => {}),
    waitForInit: jest.fn(async () => {}),
  };

  return {
    cmpAdapter,
    changeConsentStatus: (fullConsent: boolean) =>
      consentStatusCallback?.(fullConsent),
  };
}

function renderGate(
  cmpAdapter: CmpAdapter,
  onVisibilityChange: (visible: boolean) => void
) {
  return render(
    <ContentpassConsentGate
      cmpAdapter={cmpAdapter}
      contentpassConfig={contentpassConfig}
      onVisibilityChange={onVisibilityChange}
    >
      <Text>App content</Text>
    </ContentpassConsentGate>
  );
}

describe('ContentpassConsentGate failing open', () => {
  beforeEach(() => {
    mockLayerFailure = null;
    mockSdk.authState = {
      state: 'UNAUTHENTICATED',
      hasValidSubscription: false,
    } as ContentpassState;
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('tells the host app the layer is gone and reports why when the layer fails', async () => {
    const { cmpAdapter, changeConsentStatus } = createCmpAdapter();
    const onVisibilityChange = jest.fn();
    const { unmount } = renderGate(cmpAdapter, onVisibilityChange);
    await waitFor(() => expect(mockLayerFailure).not.toBeNull());
    expect(onVisibilityChange.mock.calls).toEqual([[true]]);

    const error = new Error(
      'Timed out while loading the Contentpass layer page'
    );
    act(() => mockLayerFailure!(error));

    expect(screen.getByText('App content')).toBeTruthy();
    expect(onVisibilityChange.mock.calls).toEqual([[true], [false]]);
    expect(mockSdk.reportError).toHaveBeenCalledWith(error, {
      msg: 'Failed to initialize Contentpass layer',
      tags: { uiVersion: SDK_VERSION },
    });

    act(() => changeConsentStatus(false));

    expect(onVisibilityChange.mock.calls).toEqual([[true], [false]]);

    unmount();
  });

  it('reports a CMP failure that is not an Error under the gate message', async () => {
    const { cmpAdapter } = createCmpAdapter();
    cmpAdapter.waitForInit = jest.fn(() => Promise.reject('not ready'));
    const onVisibilityChange = jest.fn();
    const { unmount } = renderGate(cmpAdapter, onVisibilityChange);

    await screen.findByText('App content');

    expect(mockSdk.reportError).toHaveBeenCalledWith(
      new Error('Failed to initialize CMP'),
      { msg: 'Failed to initialize CMP', tags: { uiVersion: SDK_VERSION } }
    );
    expect(onVisibilityChange).not.toHaveBeenCalled();

    unmount();
  });

  it('does not report the SDK ERROR state, which the SDK reports itself', async () => {
    mockSdk.authState = {
      state: 'ERROR',
      error: new Error('Failed to initialise auth state'),
    } as ContentpassState;
    const { cmpAdapter } = createCmpAdapter();
    const { unmount } = renderGate(cmpAdapter, jest.fn());

    await screen.findByText('App content');

    expect(mockSdk.reportError).not.toHaveBeenCalled();

    unmount();
  });
});
