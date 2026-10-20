---
'@contentpass/react-native-contentpass-ui': minor
---

Call `onVisibilityChange(false)` when the gate fails open while the consent layer is shown, so an app that hides its content while the layer is visible shows it again. `onVisibilityChange` is now only called when the visibility it last reported changes. Every fail-open is reported to Contentpass's error tracking, tagged with the UI package version, which needs `@contentpass/react-native-contentpass` 0.10.0 or later. The `timeouts` prop is now documented in the README.
