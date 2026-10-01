// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import { ActivityIndicator, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import ContentpassLayer from './ContentpassLayer';
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
