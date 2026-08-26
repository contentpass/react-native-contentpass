// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import type { AppStateStatus } from 'react-native';

export const LAYER_REACHABILITY_POLL_MS = 3000;
export const LAYER_REACHABILITY_TIMEOUT_MS = 4000;

export type LayerLoadErrorCopy = {
  message: string;
  retryLabel: string;
};

export function getLayerLoadErrorCopy(locale?: string): LayerLoadErrorCopy {
  const language = locale?.split(/[-_]/)[0]?.toLowerCase();

  if (language === 'de') {
    return {
      message:
        'Die Seite konnte nicht geladen werden. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
      retryLabel: 'Erneut versuchen',
    };
  }

  return {
    message:
      'This page could not be loaded. Check your internet connection and try again.',
    retryLabel: 'Try again',
  };
}

export function shouldRetryLayerLoadOnAppState(
  nextState: AppStateStatus,
  hasLoadError: boolean
): boolean {
  return hasLoadError && nextState === 'active';
}

export async function canReachLayerUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = LAYER_REACHABILITY_TIMEOUT_MS
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
