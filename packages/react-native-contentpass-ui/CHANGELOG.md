# @contentpass/react-native-contentpass-ui

## 0.11.0

### Minor Changes

- [#82](https://github.com/contentpass/react-native-contentpass/pull/82) [`6d230b2`](https://github.com/contentpass/react-native-contentpass/commit/6d230b2b843875504b276b28ec882195d865dd19) Thanks [@0x7f](https://github.com/0x7f)! - Call `onVisibilityChange(false)` when the gate fails open while the consent layer is shown, so an app that hides its content while the layer is visible shows it again. `onVisibilityChange` is now only called when the visibility it last reported changes. Every fail-open is reported to Contentpass's error tracking, tagged with the UI package version, which needs `@contentpass/react-native-contentpass` 0.10.0 or later. The `timeouts` prop is now documented in the README.

- [#82](https://github.com/contentpass/react-native-contentpass/pull/82) [`613ad69`](https://github.com/contentpass/react-native-contentpass/commit/613ad69fefb6e56c72749db803ef48569bff5b75) Thanks [@0x7f](https://github.com/0x7f)! - Give the consent layer's page 30 seconds to load before the gate fails open, instead of 8, the same default as every other gate timeout. The wait starts when the layer mounts and ends once the page and every resource it loads have arrived, so it includes starting the device's WebView for the first time. On fresh Android installs that often took longer than 8 seconds, and the gate failed open before the layer ever showed. `timeouts.layerPageLoadTimeoutMs` still overrides the default.

## 0.10.1

### Patch Changes

- [#78](https://github.com/contentpass/react-native-contentpass/pull/78) [`1b0dae8`](https://github.com/contentpass/react-native-contentpass/commit/1b0dae8ace4128b0ca5261415f50adaeca47bf4b) Thanks [@0x7f](https://github.com/0x7f)! - Use `StyleSheet.absoluteFill` instead of `StyleSheet.absoluteFillObject` for the consent overlay and the layer's loading view. React Native 0.85 removed the deprecated alias, and spreading the missing property left both views without absolute positioning, so a fresh install showed a white screen instead of the consent layer.

- [#79](https://github.com/contentpass/react-native-contentpass/pull/79) [`b09faee`](https://github.com/contentpass/react-native-contentpass/commit/b09faee4418700d52a4d0a18bd2d98c4a380f79d) Thanks [@0x7f](https://github.com/0x7f)! - Resurface the Contentpass consent layer after a failed or cancelled login instead of permanently showing unprotected app content. `ContentpassConsentGate`'s `contentpass` handler routed every `authenticate()` rejection -- including a plain user-cancelled login -- through `failOpen`, which latches `failedOpen` true for the life of the mounted component with no reset path, so a single cancelled or flaky login hid the gate for the rest of the session.

## 0.10.0

### Minor Changes

- Fire `wall`/`show` when the consent layer becomes visible and `wall`/`accept`/`cmp` when the CMP second layer resolves with full consent, and an `sdk`/`load` event when the Contentpass SDK is constructed, matching the events the web SDK already sends.

## 0.9.0

### Minor Changes

- Add an optional `timeouts` prop to `ContentpassConsentGate` covering every timeout-driven stage (CMP init/metadata/consent-status, Contentpass authenticate, the CMP second layer, the Contentpass init watchdog, and the layer's page-load/ready stages), each independently overridable. Fail open — rendering app content instead of blocking indefinitely — when CMP/SDK startup, the first-layer WebView, or the CMP second layer stalls or errors. Require a valid subscription, not just an authenticated user, to bypass the consent layer. Unregister the SDK state observer on cleanup to prevent stale updates.

## 0.8.1

### Patch Changes

- Keep the first-layer footer above the Android system navigation bar so the privacy-policy link stays tappable.

## 0.8.0

### Minor Changes

- e34a7c9: Reload the first layer after a network error and recover the consent gate from SDK ERROR when the app returns to the foreground.

## 0.7.1

### Patch Changes

- Fix iOS ready race

## 0.7.0

### Minor Changes

- Fix race in Layer init

## 0.6.1

### Patch Changes

- Harden OneTrust consent status

## 0.6.0

### Minor Changes

- Improve OneTrust integration and handling of first layer links

## 0.5.0

### Minor Changes

- Bump versions

## 0.4.0

### Minor Changes

- Allow defining preferred layer language

## 0.3.1

### Patch Changes

- Fix loading state during login

## 0.3.0

### Minor Changes

- Improve external links in first-layer

## 0.2.0

### Minor Changes

- [#52](https://github.com/contentpass/react-native-contentpass/pull/52) [`347e72d`](https://github.com/contentpass/react-native-contentpass/commit/347e72d5bd7cc19e796cb0992f4a1873a6ef11c4) Thanks [@0x7f](https://github.com/0x7f)! - Improve OneTrust integration

## 0.1.1

### Patch Changes

- [#50](https://github.com/contentpass/react-native-contentpass/pull/50) [`ff6233b`](https://github.com/contentpass/react-native-contentpass/commit/ff6233b5cddfba28db12763738c75489c44233e3) Thanks [@0x7f](https://github.com/0x7f)! - Clean up debug logs, fix consent layer theme and SDK version string. Add README documentation for all packages.

## 0.1.0

### Minor Changes

- [#48](https://github.com/contentpass/react-native-contentpass/pull/48) [`9f3eddf`](https://github.com/contentpass/react-native-contentpass/commit/9f3eddfc572bd3db85039aace37d13b304a0963e) Thanks [@0x7f](https://github.com/0x7f)! - Initial release of the Contentpass React Native UI components
