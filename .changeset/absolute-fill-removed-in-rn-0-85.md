---
'@contentpass/react-native-contentpass-ui': patch
---

Use `StyleSheet.absoluteFill` instead of `StyleSheet.absoluteFillObject` for the consent overlay and the layer's loading view. React Native 0.85 removed the deprecated alias, and spreading the missing property left both views without absolute positioning, so a fresh install showed a white screen instead of the consent layer.
