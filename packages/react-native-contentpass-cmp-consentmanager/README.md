# @contentpass/react-native-contentpass-cmp-consentmanager

A [Consentmanager](https://www.consentmanager.net/) CMP adapter for `@contentpass/react-native-contentpass`. Bridges the Consentmanager SDK (`cm-sdk-react-native-v3`) to the Contentpass `CmpAdapter` interface, so the Contentpass consent layer can drive consent through Consentmanager.

## Installation

```bash
npm install @contentpass/react-native-contentpass-cmp-consentmanager
# or
yarn add @contentpass/react-native-contentpass-cmp-consentmanager
```

### Peer dependencies

- `@contentpass/react-native-contentpass`
- `cm-sdk-react-native-v3` — the Consentmanager React Native SDK

Because `cm-sdk-react-native-v3` ships native code, make sure to follow its [native setup instructions](https://help.consentmanager.net/books/cmp/page/reactnative-1-consentmanager-sdk-integration-9b0) (run `pod install` for iOS, rebuild the app for Android, and — as stated by the SDK — do not use Expo Go).

## Usage

The adapter is deliberately stateless: it delegates every read to the Consentmanager SDK at call time. Because of that, the consumer is responsible for preparing the SDK **before** creating the adapter, so that the SDK has already fetched its server-side configuration (purposes and vendors) by the time Contentpass starts asking for it.

```tsx
import CmSdkReactNativeV3, {
  setUrlConfig,
  setWebViewConfig,
  isConsentRequired,
  WebViewPosition,
  BackgroundStyle,
} from 'cm-sdk-react-native-v3';
import { createConsentmanagerCmpAdapter } from '@contentpass/react-native-contentpass-cmp-consentmanager';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

// 1. Configure the Consentmanager SDK. `setWebViewConfig` still has to be
//    called because the SDK uses its WebView to display the second layer
//    (granular settings), which is opened via `cmpAdapter.showSecondLayer()`.
await setWebViewConfig({
  position: WebViewPosition.FullScreen,
  backgroundStyle: BackgroundStyle.dimmed('black', 0.5),
});

await setUrlConfig({
  id: 'YOUR_CODE_ID',
  domain: 'delivery.consentmanager.net',
  language: 'EN',
  appName: 'MyApp',
});

// 2. Trigger the Consentmanager SDK to fetch its server-side configuration
//    (purposes, vendors, whether consent is required) without opening the
//    Consentmanager consent layer. Awaiting this call is what guarantees
//    that the adapter will see populated purposes/vendors. We deliberately
//    do NOT call `checkAndOpen()` here because that would display
//    Consentmanager's own first-layer UI; Contentpass's layer is meant to
//    handle that instead.
await isConsentRequired();

// 3. Create the CMP adapter. At this point the SDK already knows its
//    purposes and vendors, so any read from the adapter (`getRequiredPurposes`,
//    `getNumberOfVendors`, `hasFullConsent`) returns the real values.
const cmpAdapter: CmpAdapter = await createConsentmanagerCmpAdapter(CmSdkReactNativeV3);
```

The returned `cmpAdapter` can then be passed to `ContentpassConsentGate` from `@contentpass/react-native-contentpass-ui`, or used directly via the `CmpAdapter` interface.

> **Heads up:** if you skip step 2 (or don't await it) and then render `ContentpassConsentGate` immediately, Contentpass may observe zero purposes/vendors and treat consent as missing. Always await `isConsentRequired()` before creating the adapter.

### Full example

```tsx
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import CmSdkReactNativeV3, {
  setUrlConfig,
  setWebViewConfig,
  isConsentRequired,
  WebViewPosition,
  BackgroundStyle,
} from 'cm-sdk-react-native-v3';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import { createConsentmanagerCmpAdapter } from '@contentpass/react-native-contentpass-cmp-consentmanager';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export default function App() {
  const [cmpAdapter, setCmpAdapter] = useState<CmpAdapter | null>(null);
  const [cmpFailed, setCmpFailed] = useState(false);

  useEffect(() => {
    async function init() {
      await setWebViewConfig({
        position: WebViewPosition.FullScreen,
        backgroundStyle: BackgroundStyle.dimmed('black', 0.5),
      });
      await setUrlConfig({
        id: 'YOUR_CODE_ID',
        domain: 'delivery.consentmanager.net',
        language: 'EN',
        appName: 'MyApp',
      });
      await isConsentRequired();
      const adapter = await createConsentmanagerCmpAdapter(CmSdkReactNativeV3);
      setCmpAdapter(adapter);
    }

    init().catch((error) => {
      console.error('Failed to initialize CMP', error);
      setCmpFailed(true);
    });
  }, []);

  if (cmpFailed) {
    return <Text>Failed to load CMP</Text>;
  }

  if (!cmpAdapter) {
    return <Text>Loading...</Text>;
  }

  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <ContentpassConsentGate
        cmpAdapter={cmpAdapter}
        contentpassConfig={contentpassConfig}
      >
        <View>
          <Text>Your app content</Text>
        </View>
      </ContentpassConsentGate>
    </ContentpassSdkProvider>
  );
}
```

A runnable version of this flow lives in [`examples/consentmanager`](../../examples/consentmanager).

### Re-opening the consent settings later

`CmpAdapter` exposes `showSecondLayer()` so you can build a "Privacy settings" button that re-opens Consentmanager's settings UI:

```tsx
<Button
  title="Privacy settings"
  onPress={() => cmpAdapter.showSecondLayer('purpose').catch(console.error)}
/>
```

The promise resolves when the user dismisses the layer; the adapter then emits a fresh `onConsentStatusChange` event with the new full-consent value.

### Error handling

The adapter itself doesn't surface SDK errors. If the Consentmanager SDK fails to fetch its config (e.g. the device is offline during `isConsentRequired()`), that call will reject — handle it in your `init()` flow. To observe errors emitted *after* initialization, subscribe to the SDK's own emitter:

```tsx
import { addErrorListener } from 'cm-sdk-react-native-v3';

const subscription = addErrorListener((error) => console.warn('CMP error', error));
// ... later:
subscription.remove();
```

For further details on the Consentmanager SDK, see their [official documentation](https://help.consentmanager.net/books/cmp/page/reactnative-1-consentmanager-sdk-integration-9b0).

## API

### `createConsentmanagerCmpAdapter(sdk)`

Factory function that creates a `CmpAdapter` from a configured Consentmanager SDK instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdk` | `CmSdkReactNativeV3Module` | The Consentmanager SDK default export, after `setWebViewConfig` / `setUrlConfig` / `isConsentRequired` have been awaited. |

Returns `Promise<ConsentmanagerCmpAdapter>` (which implements `CmpAdapter`).

The adapter is stateless with respect to purposes and vendors: every call to `getRequiredPurposes`, `getNumberOfVendors`, and `hasFullConsent` re-reads `getUserStatus()` from the Consentmanager SDK, so the adapter always reflects the SDK's current state.

### Default export

The package also exports the `ConsentmanagerCmpAdapter` class as the default export. In almost all integrations you should use the `createConsentmanagerCmpAdapter` factory; the class is exported mainly for type annotations and testing.

### `CmpAdapter` methods provided

| Method | Description |
|--------|-------------|
| `waitForInit()` | Returns an already-resolved promise. Initialization readiness is the **caller's** responsibility: await `isConsentRequired()` (or another SDK call that performs the server fetch) before creating the adapter. |
| `acceptAll()` | Calls `sdk.acceptAll()` and then emits a `onConsentStatusChange` event with the new full-consent value. |
| `denyAll()` | Calls `sdk.rejectAll()` and then emits a `onConsentStatusChange` event with the new full-consent value. |
| `hasFullConsent()` | Re-reads the Consentmanager user status and returns `true` iff every non-regulated purpose is granted. Returns `false` when the SDK hasn't reported any purposes yet. |
| `onConsentStatusChange(callback)` | Registers a listener and returns an unsubscribe function. The listener is invoked asynchronously with the current value shortly after subscription, and then again whenever the Consentmanager SDK reports an update (via `acceptAll`, `denyAll`, the consent layer closing, or any other `didReceiveConsent` event). Values are **not** deduplicated — the listener may fire with the same value twice in a row. |
| `showSecondLayer(view)` | Opens the Consentmanager consent settings UI via `sdk.forceOpen(true)`. The returned promise resolves when the user dismisses the layer, at which point a `onConsentStatusChange` event is emitted. Note: the `view` parameter is accepted for interface compatibility but currently ignored — Consentmanager renders a single settings screen. |
| `getRequiredPurposes()` | Re-reads the Consentmanager user status and returns the list of purpose identifiers the app is expected to honour. Purpose ids starting with `r` (Consentmanager's regulated / legitimate-interest purposes) are filtered out, since they are not part of the explicit-consent set Contentpass evaluates. |
| `getNumberOfVendors()` | Re-reads the Consentmanager user status and returns the current vendor count. |

## License

MIT
