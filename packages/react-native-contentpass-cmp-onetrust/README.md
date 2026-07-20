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

### Required patch for `react-native-onetrust-cmp`

The upstream `react-native-onetrust-cmp` package does not expose `getPreferenceCenterData` and `getBannerData` as native methods, which this adapter requires. You need to apply a patch using [patch-package](https://github.com/ds300/patch-package).

1. Install `patch-package`:
   ```bash
   npm install --save-dev patch-package postinstall-postinstall
   ```
2. Add a `postinstall` script to your `package.json`:
   ```json
   "scripts": {
     "postinstall": "patch-package"
   }
   ```
3. Copy the patch file from [`examples/onetrust/patches/`](../../examples/onetrust/patches/) into a `patches/` directory in your project root.
4. Run `npm install` (or `yarn`) to apply the patch.

### Expo config plugin (`react-native-app-auth`)

The Contentpass login flow uses `react-native-app-auth`, which requires the iOS `AppDelegate` to conform to the `RNAppAuthAuthorizationFlowManager` protocol. On Expo SDK 55+ the `AppDelegate` is generated in Swift, and only `react-native-app-auth` **≥ 8.3.0** adds this conformance correctly via its own config plugin. Make sure you are on a compatible version and register its plugin in your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "react-native-app-auth"
    ]
  }
}
```

> If login crashes with `does not conform to RNAppAuthAuthorizationFlowManager`, upgrade `react-native-app-auth` to `>= 8.3.0` and re-run `expo prebuild --clean`.

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

### `createOnetrustCmpAdapter(sdk, options)`

Factory function that creates a `CmpAdapter` from an initialized OneTrust SDK instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `sdk` | `OTPublishersNativeSDK` | An initialized OneTrust SDK instance (after `startSDK` has resolved). |
| `options.attGroupIds` | `string[]` | OneTrust group IDs linked to iOS App Tracking Transparency (ATT). These groups are logged but do not keep the Contentpass consent layer open. |

Returns `Promise<CmpAdapter>`.

The adapter fetches banner and preference center data from the OneTrust SDK during creation, and automatically extracts TCF purpose IDs and the vendor count.

### App Tracking Transparency (ATT)

ATT is an Apple system permission, not a Contentpass consent decision. The adapter never presents the ATT prompt or attempts to set the ATT status. Configure OneTrust to manage any ATT pre- and post-prompt, and let the application decide when to request ATT.

If OneTrust has categories linked to ATT, pass their group IDs when creating the adapter. A denied or unresolved ATT permission can leave an ATT-linked OneTrust category disabled even after the user accepts all CMP purposes. Those categories must not keep the Contentpass layer open.

```tsx
const cmpAdapter = await createOnetrustCmpAdapter(OTPublishersNativeSDK, {
  // Use the ATT-linked OptanonGroupIds from the client's OneTrust configuration.
  attGroupIds: ['C0004'],
});
```

The adapter logs every group and marks configured ATT groups as `isAttGroup: true`, making the configuration verifiable in device logs. It warns when a configured group ID is absent from the OneTrust preference-center data.

Clients that want ATT before Contentpass must handle it before constructing the adapter:

1. Configure the iOS `NSUserTrackingUsageDescription` purpose string.
2. Initialize OneTrust on every app launch.
3. Present OneTrust's ATT flow (`showConsentUI(OTDevicePermission.IDFA)`) at the client's chosen point in the app journey.
4. Synchronize the resulting system status with OneTrust using its native `checkAndLogConsent(for: .idfa)` API. The current React Native OneTrust bridge does not expose that API, so clients need to expose it in their native bridge or obtain an upstream version that does.
5. Create the Contentpass adapter with the ATT-linked `attGroupIds` as shown above.

Do not run a second OneTrust `saveConsent` call for ATT from `acceptAll()`. The ATT system status and CMP consent are separate operations.

### Diagnostic logs

The adapter emits structured `console.debug` logs for CMP initialization, OneTrust events, consent actions, group statuses, ATT status (when the installed bridge exposes it), and stale asynchronous reads. After `acceptAll()` or `denyAll()`, it records immediate snapshots and rechecks consent after 100, 500, and 1000 milliseconds. After a successful `acceptAll()`, the adapter allows OneTrust up to 10 seconds to settle `shouldShowBanner`; the temporary acknowledgement clears as soon as OneTrust returns `false`. This makes native persistence delays, re-consent, and ATT-linked group states visible without changing the user's consent.

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
