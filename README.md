# react-native-contentpass

Monorepo for the Contentpass React Native SDK and related packages.

## Packages

| Package | Description |
|---------|-------------|
| [`@contentpass/react-native-contentpass`](./packages/react-native-contentpass) | Core SDK — authentication, subscription validation, and impression tracking. |
| [`@contentpass/react-native-contentpass-ui`](./packages/react-native-contentpass-ui) | Pre-built UI components for the Contentpass consent layer. |
| [`@contentpass/react-native-contentpass-cmp-onetrust`](./packages/react-native-contentpass-cmp-onetrust) | OneTrust CMP adapter for the Contentpass SDK. |

## Examples

| Example | Description |
|---------|-------------|
| [`examples/onetrust`](./examples/onetrust) | Integration using OneTrust as the CMP. |
| [`examples/sourcepoint`](./examples/sourcepoint) | Integration using Sourcepoint as the CMP (bare React Native). |
| [`examples/sourcepoint-expo`](./examples/sourcepoint-expo) | Integration using Sourcepoint as the CMP (Expo). |

## Contributing

See the [contributing guide](./packages/react-native-contentpass/docs/CONTRIBUTING.md).

## License

MIT
