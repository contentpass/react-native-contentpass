# @contentpass/react-native-contentpass-ui

Pre-built UI components for integrating the Contentpass consent layer into React Native apps. Renders the Contentpass first-layer consent dialog in a WebView and manages its visibility based on the user's authentication and consent state.

## Installation

```bash
npm install @contentpass/react-native-contentpass-ui
# or
yarn add @contentpass/react-native-contentpass-ui
```

### Peer dependencies

Make sure the following peer dependencies are installed in your project:

- `@contentpass/react-native-contentpass`
- `react`
- `react-native`
- `react-native-webview`

You also need a CMP adapter (e.g. `@contentpass/react-native-contentpass-cmp-onetrust`) that implements the `CmpAdapter` interface.

## Components

### `ContentpassConsentGate`

A gate component that wraps your app content. It automatically shows the Contentpass consent layer when the user has neither authenticated with Contentpass nor given full CMP consent. Once consent is granted or the user authenticates, the layer is dismissed and the children are displayed.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | — | The app content to render when consent is given or the user is authenticated. |
| `cmpAdapter` | `CmpAdapter` | Yes | — | A CMP adapter instance (e.g. from `@contentpass/react-native-contentpass-cmp-onetrust`). |
| `contentpassConfig` | `ContentpassConfig` | Yes | — | The Contentpass SDK configuration object. |
| `hideAppWhenVisible` | `boolean` | No | `true` | When `true`, the app content is completely replaced by the consent layer. When `false`, the consent layer is rendered as an overlay on top of the app content. |
| `locale` | `string` | No | — | Forces the consent layer to be displayed in the given locale (e.g. `"de"`, `"es"`). When omitted, the layer picks the locale from the user's browser/device preferences and falls back to English. Unsupported values are ignored by the layer. |
| `onVisibilityChange` | `(visible: boolean) => void` | No | — | Callback invoked when the consent layer visibility changes, including with `false` when the gate fails open while the layer is shown. |
| `timeouts` | `ContentpassGateTimeouts` | No | 30s each | Overrides how long the gate waits for each step before it fails open. See [Timeouts and failing open](#timeouts-and-failing-open). |

#### Timeouts and failing open

When a step does not finish in time, or fails, the gate fails open: it renders `children` for the rest of the mounted session instead of blocking the app, and reports the failure to Contentpass. Every timeout defaults to 30 seconds and can be overridden on its own through `timeouts`:

| Key | What the gate waits for |
|-----|-------------------------|
| `cmpInitTimeoutMs` | `cmpAdapter.waitForInit()` |
| `cmpMetadataTimeoutMs` | `cmpAdapter.getRequiredPurposes()` and `getNumberOfVendors()` |
| `cmpConsentStatusTimeoutMs` | The first `cmpAdapter.hasFullConsent()` |
| `contentpassInitTimeoutMs` | The Contentpass SDK leaving its `INITIALISING` state |
| `authenticateTimeoutMs` | The Contentpass login or signup flow |
| `secondLayerTimeoutMs` | `cmpAdapter.showSecondLayer()` |
| `layerPageLoadTimeoutMs` | The consent layer's page and every resource it loads, counted from when the layer mounts. On a fresh install this includes starting the device's WebView for the first time. |
| `layerReadyTimeoutMs` | The loaded page reporting that it is ready |

```tsx
<ContentpassConsentGate
  cmpAdapter={cmpAdapter}
  contentpassConfig={contentpassConfig}
  timeouts={{ layerPageLoadTimeoutMs: 45_000 }}
>
  {/* Your app content */}
</ContentpassConsentGate>
```

## Usage

Wrap your app with `ContentpassSdkProvider` (from `@contentpass/react-native-contentpass`) and place `ContentpassConsentGate` around the content that should be gated:

```tsx
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

function App() {
  // Initialize your CMP and create an adapter first
  const cmpAdapter: CmpAdapter = /* ... */;
  const contentpassConfig = /* your ContentpassConfig */;

  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <ContentpassConsentGate
        cmpAdapter={cmpAdapter}
        contentpassConfig={contentpassConfig}
        hideAppWhenVisible={false}
      >
        {/* Your app content */}
      </ContentpassConsentGate>
    </ContentpassSdkProvider>
  );
}
```

For a full working example using OneTrust as the CMP, see the [`examples/onetrust`](../../examples/onetrust) directory.

## How it works

1. `ContentpassConsentGate` waits for both the CMP adapter and the Contentpass SDK to be ready.
2. It evaluates whether the user needs to see the consent layer: the layer is shown when the user is **neither** authenticated with Contentpass **nor** has given full consent via the CMP.
3. The consent layer itself is a hosted web page rendered in a WebView (`ContentpassLayer`). It communicates back to the native app via `postMessage` to trigger actions like "accept all", "show CMP details", or "login/signup with Contentpass".
4. When the user takes an action (e.g. accepts all cookies or logs in), the gate re-evaluates and hides the layer when appropriate.

## Requirements

- React Native >= 0.76.0
- `@contentpass/react-native-contentpass` >= 0.10.0 (peer dependency)
- `react-native-webview` (peer dependency)

## License

MIT
