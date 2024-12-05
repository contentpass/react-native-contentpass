# @contentpass/react-native-contentpass

Contentpass React Native SDK enables easy integration of Contentpass functionality into your React Native applications.

## Installation
Install the package using npm or Yarn:

```sh
npm install @contentpass/react-native-contentpass
```

or

```sh
yarn add @contentpass/react-native-contentpass
```

### Peer Dependencies
The following peer dependencies must also be installed:
- [react](https://github.com/facebook/react) (Required for React Native projects.)
- [react-native](https://github.com/facebook/react-native) (Core React Native framework)
- [react-native-app-auth](https://github.com/FormidableLabs/react-native-app-auth) (Used for OAuth 2.0 authentication)
- [react-native-encrypted-storage](https://github.com/emeraldsanto/react-native-encrypted-storage) (Ensures secure storage of authentication tokens)

Some dependencies require additional setup in the native code. Refer to their official guides:
- [react-native-app-auth setup](https://commerce.nearform.com/open-source/react-native-app-auth/docs#setup)
- [react-native-encrypted-storage setup](https://github.com/emeraldsanto/react-native-encrypted-storage?tab=readme-ov-file#installation)

### Expo support
If you are using Expo, you need to run the following command to enable modifications to the `ios` and `android` directories:

```sh
npx expo prebuild
```

## Usage

### Initialization
Wrap your app's root component with ContentpassSdkProvider. The provider requires a configuration object (contentpassConfig) with the following properties:
- `propertyId` - Your unique property ID (ask Contentpass team for details)
- `planId` - The ID of the plan you want to check the user's subscription status against (ask Contentpass team for details)
- `issuer` - The OAuth 2.0 server URL (e.g. `https://my.contentpass.net`)
- `redirectUrl` - the redirect URL of your app to which the OAuth2 server will redirect after the authentication
- `samplingRate` - Optional: The rate at which the SDK will send impression events for unauthenticated users. Default is 0.05 (5%)
- `logLevel` - Optional: The log level for the SDK. By default logger is disabled. Possible values are 'info', 'warn', 'error' and 'debug'


```jsx
import React from 'react';
import { ContentpassSdkProvider } from '@contentpass/react-native-contentpass';

const contentpassConfig = {
  propertyId: 'property-id',
  planId: 'plan-id',
  issuer: 'https://my.contentpass.net',
  redirectUrl: 'com.yourapp://oauthredirect',
  samplingRate: 0.1,
  logLevel: 'info'
};

const App = () => {
  return (
    <ContentpassSdkProvider contentpassConfig={contentpassConfig}>
      <YourApp />
    </ContentpassSdkProvider>
  );
};

export default App;
```

### SDK Methods
The SDK exposes the following methods through the `useContentpassSdk` hook:

### authenticate
Initiates the OAuth 2.0 authentication process via a modal interface. It validates the user’s active Contentpass subscriptions
upon successful authentication.

### countImpression
Tracks and increments the impression count for the current user. This method should be invoked whenever a user views a
piece of content. It applies to all users, whether authenticated or unauthenticated.

### registerObserver
Registers a callback function to listen for changes in the user’s authentication and subscription status. The observer function
receives a state object describing the current status (see the exported [ContentpassState](./src/types/ContentpassState.ts) type).

### unregisterObserver
Unregisters a previously registered observer. The observer will no longer receive updates.

### logout
Logs the user out by clearing all stored authentication tokens.

### recoverFromError
During background token refresh, an error state may occur due to poor or no internet connection. This is indicated by the
`state` switching to `ERROR`. The state object includes a reference to the original exception that was thrown. As the SDK
does not monitor the device's connection state, you must notify the SDK when the network connection has been reestablished
or improved. The SDK will then refresh and revalidate the user's authentication tokens.

```jsx
import React, { useEffect } from 'react';
import { useContentpassSdk } from '@contentpass/react-native-contentpass';
import { Button, View } from 'react-native';

const YourApp = () => {
  const {
    authenticate,
    countImpression,
    registerObserver,
    unregisterObserver,
    logout,
    recoverFromError
  } = useContentpassSdk();

  useEffect(() => {
    const observer = (state) => {
      console.log('Contentpass state changed:', state);
    };

    registerObserver(observer);

    return () => {
      unregisterObserver(observer);
    };
  }, []);

  return (
    <View>
      <Button onPress={authenticate} title={'Authenticate'} />
      <Button onPress={countImpression} title={'Count Impression'} />
    </View>
  );
};
```

## Integration with Sourcepoint SDK

See the [Sourcepoint SDK documentation](docs/SOURCEPOINT_SDK_INTEGRATION.md) for information on integrating the Contentpass SDK with the Sourcepoint SDK.

## Contributing

See the [contributing guide](docs/CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.


## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
