# @contentpass/react-native-contentpass-cmp-consentmanager

A [Consentmanager](https://www.consentmanager.net/) CMP adapter for `@contentpass/react-native-contentpass`. Bridges the Consentmanager SDK (`cm-sdk-react-native-v3`) to the Contentpass `CmpAdapter` interface, so the Contentpass consent layer can manage consent through Consentmanager.

## Installation

```bash
npm install @contentpass/react-native-contentpass-cmp-consentmanager
# or
yarn add @contentpass/react-native-contentpass-cmp-consentmanager
```

### Peer dependencies

- `@contentpass/react-native-contentpass`
- `cm-sdk-react-native-v3` — the Consentmanager React Native SDK must be installed and configured in your project

## Usage

First, initialize the Consentmanager SDK, then create the adapter using `createConsentmanagerCmpAdapter`:

```tsx
import CmSdkReactNativeV3, {
  setUrlConfig,
  setWebViewConfig,
  checkAndOpen,
  WebViewPosition,
  BackgroundStyle,
  BlurEffectStyle,
} from 'cm-sdk-react-native-v3';
import { createConsentmanagerCmpAdapter } from '@contentpass/react-native-contentpass-cmp-consentmanager';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

// 1. Configure the Consentmanager SDK
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

// 2. Initialize consent checking
await checkAndOpen(false);

// 3. Create the CMP adapter
const cmpAdapter: CmpAdapter = await createConsentmanagerCmpAdapter(CmSdkReactNativeV3);
```

The returned `cmpAdapter` can then be passed to `ContentpassConsentGate` from `@contentpass/react-native-contentpass-ui`, or used directly via the `CmpAdapter` interface.

### Full example

```tsx
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import CmSdkReactNativeV3, {
  setUrlConfig,
  setWebViewConfig,
  checkAndOpen,
  WebViewPosition,
  BackgroundStyle,
} from 'cm-sdk-react-native-v3';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import { createConsentmanagerCmpAdapter } from '@contentpass/react-native-contentpass-cmp-consentmanager';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export default function App() {
  const [cmpAdapter, setCmpAdapter] = useState<CmpAdapter | null>(null);

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
      await checkAndOpen(false);
      const adapter = await createConsentmanagerCmpAdapter(CmSdkReactNativeV3);
      setCmpAdapter(adapter);
    }

    init().catch((error) => console.error('Failed to initialize CMP', error));
  }, []);

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

For further details on the Consentmanager SDK, see their [official documentation](https://help.consentmanager.net/books/cmp/page/reactnative-1-consentmanager-sdk-integration-9b0).

## API

### `createConsentmanagerCmpAdapter(sdk)`

Factory function that creates a `CmpAdapter` from an initialized Consentmanager SDK instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdk` | `CmSdkReactNativeV3Module` | The Consentmanager SDK default export (after `setUrlConfig` and `checkAndOpen` have been called). |

Returns `Promise<CmpAdapter>`.

The adapter fetches user status from the Consentmanager SDK during creation and automatically extracts purpose IDs and the vendor count.

### `CmpAdapter` methods provided

| Method | Description |
|--------|-------------|
| `acceptAll()` | Programmatically accepts all consent purposes via Consentmanager. |
| `denyAll()` | Programmatically rejects all consent purposes via Consentmanager. |
| `hasFullConsent()` | Checks whether all consent purposes are granted by querying each purpose status. |
| `onConsentStatusChange(callback)` | Registers a listener that fires whenever full-consent status changes. Returns an unsubscribe function. |
| `showSecondLayer(view)` | Opens the Consentmanager consent layer settings page via `forceOpen(true)`. The returned promise resolves when the user dismisses it. |
| `getRequiredPurposes()` | Returns the list of purpose identifiers extracted from the Consentmanager user status. |
| `getNumberOfVendors()` | Returns the vendor count from the Consentmanager user status. |
| `waitForInit()` | Resolves immediately (Consentmanager initialization is handled before adapter creation). |

## License

MIT
