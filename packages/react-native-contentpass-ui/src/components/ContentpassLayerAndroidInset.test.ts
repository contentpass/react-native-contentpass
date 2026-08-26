// Copyright 2026 Content Pass GmbH. All Rights Reserved.

import {
  ANDROID_NAVIGATION_BAR_HEIGHT_DP,
  getAndroidOverlayNavigationBarInset,
} from './ContentpassLayerAndroidInset';

describe('getAndroidOverlayNavigationBarInset', () => {
  it('pads when the window is edge-to-edge', () => {
    expect(
      getAndroidOverlayNavigationBarInset({
        windowHeight: 800,
        screenHeight: 800,
        statusBarHeight: 24,
      })
    ).toBe(ANDROID_NAVIGATION_BAR_HEIGHT_DP);
  });

  it('does not pad when the window already excludes the navigation bar', () => {
    expect(
      getAndroidOverlayNavigationBarInset({
        windowHeight: 728,
        screenHeight: 800,
        statusBarHeight: 24,
      })
    ).toBe(0);
  });

  it('does not pad when only the navigation bar is reserved', () => {
    expect(
      getAndroidOverlayNavigationBarInset({
        windowHeight: 752,
        screenHeight: 800,
        statusBarHeight: 24,
      })
    ).toBe(0);
  });

  it('pads when the status bar is reserved but the navigation bar overlays', () => {
    expect(
      getAndroidOverlayNavigationBarInset({
        windowHeight: 776,
        screenHeight: 800,
        statusBarHeight: 24,
      })
    ).toBe(ANDROID_NAVIGATION_BAR_HEIGHT_DP);
  });
});
