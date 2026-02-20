# @contentpass/react-native-contentpass-cmp-onetrust

A [OneTrust](https://www.onetrust.com/) CMP adapter for `@contentpass/react-native-contentpass`. Bridges the OneTrust SDK (`react-native-onetrust-cmp`) to the Contentpass `CmpAdapter` interface, so the Contentpass consent layer can manage consent through OneTrust.

## Installation

```bash
npm install @contentpass/react-native-contentpass-cmp-onetrust
# or
yarn add @contentpass/react-native-contentpass-cmp-onetrust
```

### Peer dependencies

- `@contentpass/react-native-contentpass`
- `react-native-onetrust-cmp` — the OneTrust React Native SDK must be installed and configured in your project

## Usage

First, initialize the OneTrust SDK, then create the adapter using `createOnetrustCmpAdapter`:

```tsx
import OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { createOnetrustCmpAdapter } from '@contentpass/react-native-contentpass-cmp-onetrust';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

// 1. Start the OneTrust SDK
await OTPublishersNativeSDK.startSDK(
  'cdn.cookielaw.org',   // CDN location
  'YOUR_APP_ID',         // OneTrust app ID
  'en',                  // language code
  {},                    // params
  false                  // auto-show banner
);

// 2. Create the CMP adapter
const cmpAdapter: CmpAdapter = await createOnetrustCmpAdapter(OTPublishersNativeSDK);
```

The returned `cmpAdapter` can then be passed to `ContentpassConsentGate` from `@contentpass/react-native-contentpass-ui`, or used directly via the `CmpAdapter` interface.

### Full example

```tsx
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import OTPublishersNativeSDK from 'react-native-onetrust-cmp';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';
import { ContentpassConsentGate } from '@contentpass/react-native-contentpass-ui';
import { createOnetrustCmpAdapter } from '@contentpass/react-native-contentpass-cmp-onetrust';
import type { CmpAdapter } from '@contentpass/react-native-contentpass';

export default function App() {
  const [cmpAdapter, setCmpAdapter] = useState<CmpAdapter | null>(null);

  useEffect(() => {
    OTPublishersNativeSDK.startSDK('cdn.cookielaw.org', 'YOUR_APP_ID', 'en', {}, false)
      .then(() => createOnetrustCmpAdapter(OTPublishersNativeSDK))
      .then((adapter) => setCmpAdapter(adapter))
      .catch((error) => console.error('Failed to initialize CMP', error));
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

For a complete working example, see the [`examples/onetrust`](../../examples/onetrust) directory.

## API

### `createOnetrustCmpAdapter(sdk)`

Factory function that creates a `CmpAdapter` from an initialized OneTrust SDK instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdk` | `OTPublishersNativeSDK` | An initialized OneTrust SDK instance (after `startSDK` has resolved). |

Returns `Promise<CmpAdapter>`.

The adapter fetches banner and preference center data from the OneTrust SDK during creation, and automatically extracts TCF purpose IDs and the vendor count.

### `CmpAdapter` methods provided

| Method | Description |
|--------|-------------|
| `acceptAll()` | Saves "accept all" consent via OneTrust. |
| `denyAll()` | Saves "reject all" consent via OneTrust. |
| `hasFullConsent()` | Checks whether all consent categories are granted. |
| `onConsentStatusChange(callback)` | Registers a listener that fires whenever full-consent status changes. Returns an unsubscribe function. |
| `showSecondLayer(view)` | Opens the OneTrust preference center (`'purpose'`) or vendor list (`'vendor'`) UI. The returned promise resolves when the user dismisses it. |
| `getRequiredPurposes()` | Returns the list of TCF purpose identifiers extracted from OneTrust. |
| `getNumberOfVendors()` | Returns the vendor count parsed from the OneTrust banner data. |
| `waitForInit()` | Resolves immediately (OneTrust initialization is handled before adapter creation). |

## License

MIT
