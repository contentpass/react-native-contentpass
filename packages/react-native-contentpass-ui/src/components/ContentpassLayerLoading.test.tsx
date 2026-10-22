// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import { ActivityIndicator, StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';
import ContentpassLayer from './ContentpassLayer';
import { UI_OPERATION_TIMEOUT_MS } from './ContentpassConsentGateStartup';
import type { ContentpassLayerEvents } from './ContentpassLayerEvents';

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

const eventHandler: ContentpassLayerEvents = {
  acceptAll: jest.fn(async () => {}),
  contentpass: jest.fn(async () => {}),
  sendEvent: jest.fn(),
  showSecondLayer: jest.fn(async () => {}),
};

describe('ContentpassLayer loading indicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fills the layer absolutely until the first layer reports ready', () => {
    const { UNSAFE_getByType, unmount } = render(
      <ContentpassLayer
        baseUrl="https://example.test"
        eventHandler={eventHandler}
        instanceId="instance"
        planId="plan"
        propertyId="property"
        purposesList={[]}
        vendorCount={0}
        onFailure={jest.fn()}
      />
    );

    const loading = UNSAFE_getByType(ActivityIndicator).parent;

    expect(StyleSheet.flatten(loading?.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });

    unmount();
  });
});

describe('ContentpassLayer page load', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function renderLayer(onFailure: (error: unknown) => void) {
    return render(
      <ContentpassLayer
        baseUrl="https://example.test"
        eventHandler={eventHandler}
        instanceId="instance"
        planId="plan"
        propertyId="property"
        purposesList={[]}
        vendorCount={0}
        onFailure={onFailure}
      />
    );
  }

  it('waits the full UI operation budget for a slow page before failing', () => {
    const onFailure = jest.fn();
    const { unmount } = renderLayer(onFailure);

    act(() => jest.advanceTimersByTime(UI_OPERATION_TIMEOUT_MS - 1));
    expect(onFailure).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1));
    expect(onFailure).toHaveBeenCalledWith(
      new Error('Timed out while loading the Contentpass layer page')
    );

    unmount();
  });

  it('fails with the status of an HTTP error on the page', () => {
    const onFailure = jest.fn();
    const { UNSAFE_getByType, unmount } = renderLayer(onFailure);

    act(() =>
      UNSAFE_getByType('WebView' as any).props.onHttpError({
        nativeEvent: { statusCode: 503, description: 'Service Unavailable' },
      })
    );

    expect(onFailure).toHaveBeenCalledWith(
      new Error('Received HTTP 503 while loading the Contentpass layer page')
    );

    unmount();
  });
});
