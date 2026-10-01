---
'@contentpass/react-native-contentpass-ui': patch
---

Resurface the Contentpass consent layer after a failed or cancelled login instead of permanently showing unprotected app content. `ContentpassConsentGate`'s `contentpass` handler routed every `authenticate()` rejection -- including a plain user-cancelled login -- through `failOpen`, which latches `failedOpen` true for the life of the mounted component with no reset path, so a single cancelled or flaky login hid the gate for the rest of the session.
