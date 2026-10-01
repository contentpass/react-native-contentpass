---
'@contentpass/react-native-contentpass': patch
---

Stop disabling the host app's native Sentry SDK. Initialising the Contentpass Sentry client flipped the `enableNative` flag on the bridge object shared by every Sentry client in the app, so the host app's own Sentry integration silently dropped all JavaScript errors from then on.
