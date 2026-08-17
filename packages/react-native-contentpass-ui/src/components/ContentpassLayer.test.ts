import { runInNewContext } from 'node:vm';
import { EARLY_INJECT_JS, layerReadyReducer } from './ContentpassLayer';

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

type WindowMock = {
  postMessage: (...args: unknown[]) => void;
  parent?: {
    postMessage: (...args: unknown[]) => void;
  };
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
  __cpRnPendingMessages?: string[];
  __cpRnBridgeInterval?: number | null;
};

type DocumentParentMock = {
  appendChild: (child: unknown) => void;
};

type DocumentMock = {
  head: DocumentParentMock | null;
  documentElement: DocumentParentMock | null;
  createElement: (tagName: string) => { textContent: string };
  addEventListener: (
    eventName: string,
    listener: () => void,
    useCapture: boolean
  ) => void;
};

function executeEarlyInjection({
  window,
  document,
  setInterval,
  clearInterval,
}: {
  window: WindowMock;
  document: DocumentMock;
  setInterval: (callback: () => void, delay: number) => number;
  clearInterval: (intervalId: number) => void;
}) {
  runInNewContext(EARLY_INJECT_JS, {
    window,
    document,
    setInterval,
    clearInterval,
  });
}

describe('ContentpassLayer', () => {
  it('stays visible when load-start arrives after the ready message', () => {
    const readyAfterMessage = layerReadyReducer(false, 'first-layer-ready');
    const readyAfterLoadStart = layerReadyReducer(
      readyAfterMessage,
      'load-started'
    );

    expect(readyAfterLoadStart).toBe(true);
    expect(layerReadyReducer(readyAfterLoadStart, 'url-changed')).toBe(false);
  });

  it('becomes visible when load-end fires without a ready message', () => {
    expect(layerReadyReducer(false, 'load-ended')).toBe(true);
    expect(layerReadyReducer(true, 'load-started')).toBe(true);
  });
});

describe('EARLY_INJECT_JS', () => {
  it('queues messages until the Android bridge becomes available', () => {
    const originalPostMessage = jest.fn();
    const window: WindowMock = { postMessage: originalPostMessage };
    const document: DocumentMock = {
      head: null,
      documentElement: null,
      createElement: jest.fn(() => ({ textContent: '' })),
      addEventListener: jest.fn(),
    };
    const intervalCallbacks = new Map<number, () => void>();
    const setInterval = jest.fn((callback: () => void) => {
      const intervalId = intervalCallbacks.size + 1;
      intervalCallbacks.set(intervalId, callback);
      return intervalId;
    });
    const clearInterval = jest.fn((intervalId: number) => {
      intervalCallbacks.delete(intervalId);
    });

    expect(() =>
      executeEarlyInjection({
        window,
        document,
        setInterval,
        clearInterval,
      })
    ).not.toThrow();

    const readyMessage = {
      protocol: 'contentpass-first-layer',
      type: 'REQUEST',
      action: 'FIRST_LAYER_READY',
    };
    window.postMessage(readyMessage);

    expect(originalPostMessage).toHaveBeenCalledWith(readyMessage);

    const nativePostMessage = jest.fn();
    window.ReactNativeWebView = { postMessage: nativePostMessage };
    intervalCallbacks.get(1)?.();

    expect(nativePostMessage).toHaveBeenCalledWith(
      JSON.stringify(readyMessage)
    );
    expect(clearInterval).toHaveBeenCalledWith(1);
  });

  it('waits for the DOM before inserting the first-layer styles', () => {
    const window: WindowMock = {
      postMessage: jest.fn(),
      ReactNativeWebView: { postMessage: jest.fn() },
    };
    const appendChild = jest.fn();
    let onDomContentLoaded: (() => void) | undefined;
    const style = { textContent: '' };
    const document: DocumentMock = {
      head: null,
      documentElement: null,
      createElement: jest.fn(() => style),
      addEventListener: jest.fn((_eventName, listener) => {
        onDomContentLoaded = listener;
      }),
    };

    executeEarlyInjection({
      window,
      document,
      setInterval: jest.fn(() => 1),
      clearInterval: jest.fn(),
    });

    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.addEventListener).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function),
      false
    );

    document.head = { appendChild };
    onDomContentLoaded?.();

    expect(document.createElement).toHaveBeenCalledWith('style');
    expect(style.textContent).toContain('animation-duration: 0s');
    expect(appendChild).toHaveBeenCalledWith(style);
  });

  it('forwards parent.postMessage when parent is not the same window', () => {
    const originalWindowPostMessage = jest.fn();
    const originalParentPostMessage = jest.fn();
    const parent = { postMessage: originalParentPostMessage };
    const window: WindowMock = {
      postMessage: originalWindowPostMessage,
      parent,
    };
    const document: DocumentMock = {
      head: { appendChild: jest.fn() },
      documentElement: null,
      createElement: jest.fn(() => ({ textContent: '' })),
      addEventListener: jest.fn(),
    };
    const intervalCallbacks = new Map<number, () => void>();
    const setInterval = jest.fn((callback: () => void) => {
      const intervalId = intervalCallbacks.size + 1;
      intervalCallbacks.set(intervalId, callback);
      return intervalId;
    });
    const clearInterval = jest.fn((intervalId: number) => {
      intervalCallbacks.delete(intervalId);
    });

    executeEarlyInjection({
      window,
      document,
      setInterval,
      clearInterval,
    });

    const readyMessage = {
      protocol: 'contentpass-first-layer',
      type: 'REQUEST',
      action: 'FIRST_LAYER_READY',
    };
    parent.postMessage(readyMessage, '*');

    expect(originalParentPostMessage).toHaveBeenCalledWith(readyMessage, '*');
    expect(originalWindowPostMessage).not.toHaveBeenCalled();

    const nativePostMessage = jest.fn();
    window.ReactNativeWebView = { postMessage: nativePostMessage };
    intervalCallbacks.get(1)?.();

    expect(nativePostMessage).toHaveBeenCalledWith(
      JSON.stringify(readyMessage)
    );
    expect(clearInterval).toHaveBeenCalledWith(1);
  });

  it('is safe to inject twice without starting a second bridge interval', () => {
    const window: WindowMock = { postMessage: jest.fn() };
    const document: DocumentMock = {
      head: { appendChild: jest.fn() },
      documentElement: null,
      createElement: jest.fn(() => ({ textContent: '' })),
      addEventListener: jest.fn(),
    };
    const setInterval = jest.fn(() => 7);
    const clearInterval = jest.fn();

    executeEarlyInjection({
      window,
      document,
      setInterval,
      clearInterval,
    });
    executeEarlyInjection({
      window,
      document,
      setInterval,
      clearInterval,
    });

    expect(setInterval).toHaveBeenCalledTimes(1);
    expect(window.__cpRnBridgeInterval).toBe(7);
  });
});
