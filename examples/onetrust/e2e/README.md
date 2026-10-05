# OneTrust example E2E (iOS, Maestro)

Maestro flows driving the built `examples/onetrust` app against the real
`contentpass-staging` backend and the real OneTrust test tenant — no mock
server. See `flows/` for what each one covers.

iOS only for now: the Android emulator needs hardware virtualization that
neither GitHub-hosted runner type currently provides (`ubuntu-latest` has no
`/dev/kvm`; `macos-14` has no HVF for a _nested_ hypervisor). The iOS
Simulator is a native macOS process, not a VM, so it doesn't hit this at
all — see `.github/workflows/e2e-ios.yml`. Revisit Android once there's a
runner (GitHub larger Linux runner, or self-hosted) that actually exposes
nested virtualization.

## Debug + Metro, not a Release build

The app runs as a **Debug** build with a live Metro server, not a
self-contained Release build. A Release build's JS bundle goes through
Metro's minifier, which — confirmed by inspecting the bundled output byte
for byte — silently strips the body of a core React Native polyfill module
(`setUpGlobals`), crashing the app on launch before it ever reaches the UI
(`TypeError: undefined is not a function` during module init). This is a
toolchain bug worth fixing on its own, but it isn't an E2E-infra concern, so
Debug (which skips bundling/minification at build time and fetches JS from
Metro at runtime) sidesteps it entirely. One consequence: the
`EXPO_PUBLIC_ONETRUST_APP_ID` / `EXPO_PUBLIC_GATE_TIMEOUT_MS` env vars that
pick a scenario have to be set on the **Metro process**, not on the build —
a Debug build itself is identical across all three flows.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) installed (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- [idb-companion](https://github.com/facebook/idb), which Maestro needs to drive the iOS Simulator (`brew tap facebook/fb && brew install facebook/fb/idb-companion`).
- A Metro server running with the right env vars for the scenario you want
  (see below), and a booted iOS Simulator with the app installed against it
  (`yarn ios` from `examples/onetrust` does both for local dev).
- For `flows/happy-path.yaml` only: a dedicated contentpass-staging test
  account's credentials, exported as `E2E_STAGING_EMAIL` /
  `E2E_STAGING_PASSWORD`. This is a stable fixture account, and it needs an
  active subscription to the example's plan: without one, the login hands
  the account on to the subscription checkout instead of redirecting back to
  the app, so the flow never sees `AUTHENTICATED`. Never commit these
  values; locally, export them in your shell, don't put them in a tracked
  `.env`.

## Running a flow

```sh
maestro test flows/happy-path.yaml -e E2E_STAGING_EMAIL="$E2E_STAGING_EMAIL" -e E2E_STAGING_PASSWORD="$E2E_STAGING_PASSWORD"
maestro test flows/onetrust-adapter-failure.yaml
maestro test flows/cmp-timeout-fail-open.yaml
```

The latter two need Metro itself started with the matching env var before
`yarn ios`:

```sh
EXPO_PUBLIC_ONETRUST_APP_ID=garbage-app-id npx expo start   # onetrust-adapter-failure.yaml
EXPO_PUBLIC_GATE_TIMEOUT_MS=1 npx expo start                # cmp-timeout-fail-open.yaml
```

## What `happy-path.yaml` has to step through

- The funnel's real labels are "Einwilligen & weiter" and "Login mit
  Contentpass". This app never shows a separate native OneTrust banner; the
  hosted Contentpass funnel is the only consent/login UI.
- iOS's native `ASWebAuthenticationSession` permission dialog ("Wants to Use
  ... to Sign In") appears before the OIDC login page and needs its own
  `tapOn: "Continue"`.
- After the login form is submitted, iOS may put a "Save Password?" system
  alert over the page. While it is up, it is the only thing in the UI
  hierarchy Maestro sees, so the flow dismisses it ("Not Now") before
  waiting for the app.
