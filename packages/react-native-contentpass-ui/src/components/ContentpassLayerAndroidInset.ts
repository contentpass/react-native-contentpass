// Copyright 2026 Content Pass GmbH. All Rights Reserved.

export const ANDROID_NAVIGATION_BAR_HEIGHT_DP = 48;

export function getAndroidOverlayNavigationBarInset({
  windowHeight,
  screenHeight,
  statusBarHeight,
}: {
  windowHeight: number;
  screenHeight: number;
  statusBarHeight: number;
}): number {
  const reservedHeight = screenHeight - windowHeight;

  // The RN window is already shorter than the screen, so the WebView does
  // not sit under the navigation bar.
  if (reservedHeight > statusBarHeight + 1) {
    return 0;
  }

  return ANDROID_NAVIGATION_BAR_HEIGHT_DP;
}
