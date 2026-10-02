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
  `E2E_STAGING_PASSWORD`. This is a throwaway-but-stable fixture account —
  it doesn't need a subscription (consent alone already satisfies the gate;
  login only needs to prove `AUTHENTICATED`). Never commit these values;
  locally, export them in your shell, don't put them in a tracked `.env`.

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

## Verified against a live run — one open risk

Everything in `flows/happy-path.yaml` has been run successfully against a
real simulator except the exact final outcome of a _real_ login (verifying
that needs real staging credentials, which weren't available while writing
this). Specifically confirmed live:

- The funnel's actual labels — "Einwilligen & weiter" and "Login mit
  Contentpass" — not the originally-guessed OneTrust-style English wording.
  This app never shows a separate native OneTrust banner; the hosted
  Contentpass funnel is the only consent/login UI.
- iOS's native `ASWebAuthenticationSession` permission dialog ("Wants to Use
  ... to Sign In") appears before the OIDC login page and needs its own
  `tapOn: "Continue"` — no Android equivalent.
- The OIDC login form's fields ("Email", "Password", "Log in") are
  reachable and the Email field types correctly.

**Open risk**: tapping into the Password field after typing the email
showed some flakiness locally (text landing back in the Email field) across
a few iterations — possibly a layout/animation-timing issue specific to
rapid repeated reinstalls in manual testing, rather than a real flow bug,
but not conclusively ruled out. Run `flows/happy-path.yaml` for real once
staging credentials are available and adjust the Email/Password step if it
recurs (e.g. a longer wait, or disambiguating the tap target further)
before trusting it unattended in CI.
