# OneTrust example E2E (Android, Maestro)

Maestro flows driving the built `examples/onetrust` app against the real
`contentpass-staging` backend and the real OneTrust test tenant — no mock
server. See `flows/` for what each one covers.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) installed (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- A booted Android emulator or connected device with the app already
  installed (`yarn android` from `examples/onetrust`, or the CI job's
  `assembleDebug` output).
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

The latter two need the app itself built with the matching env var before
`yarn android`:

```sh
EXPO_PUBLIC_ONETRUST_APP_ID=garbage-app-id yarn android   # onetrust-adapter-failure.yaml
EXPO_PUBLIC_GATE_TIMEOUT_MS=1 yarn android                # cmp-timeout-fail-open.yaml
```

## Before wiring this into CI: verify selectors against a live run

`flows/happy-path.yaml` targets OneTrust's banner and the Contentpass
funnel's own login trigger by visible label ("Accept All", "Log in") — both
are real, third-party/hosted UI this repo doesn't control, so those labels
are a best guess from the configured test tenant and funnel copy, not
confirmed against a live run. Run the flow once locally against a real
emulator and fix up any mismatched `tapOn` text before relying on it in CI.
The OIDC login form's own fields ("Email", "Password", "Log in") are
confirmed against `frontend/oidc`'s current English copy.
