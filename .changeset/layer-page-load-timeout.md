---
'@contentpass/react-native-contentpass-ui': minor
---

Give the consent layer's page 30 seconds to load before the gate fails open, instead of 8, the same default as every other gate timeout. The wait starts when the layer mounts and ends once the page and every resource it loads have arrived, so it includes starting the device's WebView for the first time. On fresh Android installs that often took longer than 8 seconds, and the gate failed open before the layer ever showed. `timeouts.layerPageLoadTimeoutMs` still overrides the default.
