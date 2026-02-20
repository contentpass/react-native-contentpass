# @contentpass/react-native-contentpass

The core Contentpass SDK for React Native. Handles OAuth 2.0 authentication, subscription validation, and impression tracking for Contentpass-enabled apps.

## Installation

```bash
npm install @contentpass/react-native-contentpass
# or
yarn add @contentpass/react-native-contentpass
```

### Peer dependencies

The following peer dependencies must be installed:

- [react](https://github.com/facebook/react)
- [react-native](https://github.com/facebook/react-native)
- [react-native-app-auth](https://github.com/FormidableLabs/react-native-app-auth) — OAuth 2.0 authentication
- [react-native-encrypted-storage](https://github.com/emeraldsanto/react-native-encrypted-storage) — secure token storage

Some peer dependencies require additional native setup. Refer to their official guides:

- [react-native-app-auth setup](https://commerce.nearform.com/open-source/react-native-app-auth/docs#setup)
- [react-native-encrypted-storage setup](https://github.com/emeraldsanto/react-native-encrypted-storage?tab=readme-ov-file#installation)

### Expo support

If you are using Expo, run the following command to enable native directory modifications:

```bash
npx expo prebuild
```

## Usage

### Initialization

Wrap your app's root component with `ContentpassSdkProvider`:

```tsx
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';

const contentpassConfig = {
  propertyId: 'property-id',
  planId: 'plan-id',
  issuer: 'https://my.contentpass.net',
  apiUrl: 'https://api.contentpass.net',
  redirectUrl: 'com.yourapp://oauthredirect',
  samplingRate: 0.1,  // optional, default 0.05
  logLevel: 'info',   // optional, default disabled
};

export default function App() {
  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <YourApp />
    </ContentpassSdkProvider>
  );
}
```

### Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `propertyId` | `string` | Yes | Your unique property ID (provided by Contentpass). |
| `planId` | `string` | Yes | The plan ID to check subscriptions against (provided by Contentpass). |
| `issuer` | `string` | Yes | The OAuth 2.0 server URL (e.g. `https://my.contentpass.net`). |
| `apiUrl` | `string` | Yes | The Contentpass API base URL. |
| `redirectUrl` | `string` | Yes | The deep-link URL your app registers for OAuth redirects. |
| `samplingRate` | `number` | No | Rate at which impression events are sent for unauthenticated users. Default `0.05` (5%). |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | No | SDK log level. Logging is disabled by default. |

### SDK methods

Access the SDK via the `useContentpassSdk` hook:

```tsx
import { useContentpassSdk } from '@contentpass/react-native-contentpass';

function MyComponent() {
  const {
    authenticate,
    countImpression,
    registerObserver,
    unregisterObserver,
    logout,
    recoverFromError,
    event,
  } = useContentpassSdk();

  // ...
}
```

#### `authenticate(route?)`

Initiates the OAuth 2.0 authentication flow via a modal interface. Validates the user's active Contentpass subscription upon success.

- `route` (optional): `'login'` or `'signup'` to pre-select the auth screen.

#### `countImpression()`

Tracks an impression for the current user. Call this whenever a user views a piece of content. Applies to both authenticated and unauthenticated users (subject to `samplingRate` for unauthenticated users).

#### `registerObserver(observer)`

Registers a callback that fires whenever the authentication/subscription state changes. The callback receives a `ContentpassState` object.

#### `unregisterObserver(observer)`

Removes a previously registered observer.

#### `logout()`

Logs the user out by clearing all stored authentication tokens.

#### `recoverFromError()`

When a background token refresh fails (e.g. due to network issues), the state transitions to `ERROR`. Call this method once connectivity is restored to retry token validation.

#### `event(eventCategory, eventAction, eventLabel?, samplingRate?)`

Sends a custom analytics event to Contentpass.

### State types

The observer callback receives one of the following states:

| State | `hasValidSubscription` | Description |
|-------|------------------------|-------------|
| `INITIALISING` | — | SDK is starting up and restoring any stored session. |
| `UNAUTHENTICATED` | `false` | No user is logged in. |
| `AUTHENTICATED` | `boolean` | User is logged in. `hasValidSubscription` indicates whether they have an active plan. |
| `ERROR` | — | A background token refresh failed. Contains an `error` property with the original exception. |

```tsx
import {
  ContentpassStateType,
  useContentpassSdk,
} from '@contentpass/react-native-contentpass';
import { useEffect } from 'react';

function MyComponent() {
  const { registerObserver, unregisterObserver } = useContentpassSdk();

  useEffect(() => {
    const observer = (state) => {
      switch (state.state) {
        case ContentpassStateType.AUTHENTICATED:
          console.log('Subscription active:', state.hasValidSubscription);
          break;
        case ContentpassStateType.ERROR:
          console.error('SDK error:', state.error);
          break;
      }
    };

    registerObserver(observer);
    return () => unregisterObserver(observer);
  }, [registerObserver, unregisterObserver]);
}
```

### CMP adapter interface

This package also exports the `CmpAdapter` type, which defines the interface that consent management platform adapters must implement to work with Contentpass. See [`@contentpass/react-native-contentpass-cmp-onetrust`](../react-native-contentpass-cmp-onetrust) for a ready-made OneTrust adapter.

## Integration with Sourcepoint SDK

See the [Sourcepoint SDK integration guide](./docs/SOURCEPOINT_SDK_INTEGRATION.md).

## Contributing

See the [contributing guide](./docs/CONTRIBUTING.md).

## License

MIT
