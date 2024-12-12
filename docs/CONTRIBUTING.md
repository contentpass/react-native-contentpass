# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.
- An expo example app in the `expoExample/` directory.
- A shared frontend code for example apps in the `sharedExample/` directory.

### Prerequisites IOS
#### Ruby
To be able to run ios example applications you need to have Ruby installed on your machine. We recommend using [rbenv](https://github.com/rbenv/rbenv)
to manage your Ruby versions. Before installing rbenv you can uninstall any existing Ruby versions on your machine to
prevent conflicts.

#### CocoaPods
To be able to run ios example applications you need to have CocoaPods installed on your machine. You can install CocoaPods by running the following command:

```sh
sudo gem install cocoapods
```

### Prerequisites Android
#### Android Studio
To be able to debug android example applications you need to have Android Studio installed on your machine.
You can download Android Studio from [here](https://developer.android.com/studio). It will also install the Android SDK,
Android Virtual Device (AVD) and all the necessary tools to build your android application.

### Getting started
To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development.

The [example app](/example/) and [expo example app](/expoExample/) demonstrates usage of the library. You need to run it to test any changes you make.
The default [configuration](../sharedExample/src/contentpassConfig.ts) in example apps points to contentpass testing environment.
You can change it to any other environment by updating the `contentpassConfig.ts` file.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example apps.
Changes to the library's JavaScript code will be reflected in the example apps without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or XCode to edit the native code, you can open the
- `example/android`
- `example/ios`
- `expoExample/android`
- `expoExample/ios`
directories respectively in those editors. To edit the Objective-C or Swift files, open `ios/ContentpassExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > contentpass-react-native-contentpass`.

To edit the Java or Kotlin files, open `android` in Android studio and find the source files at `@contentpass/react-native-contentpass` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

OR

```sh
yarn expo-example start
```

**NOTE**: The `expo start` command only runs the development server. To build and install the app, use the commands
described below: `yarn expo-example android`, `yarn expo-example ios`.

To run the example apps on Android:

```sh
yarn example android
```

OR

```sh
yarn expo-example android
```

To run the example apps on iOS:

**NOTE**: You need to run `bundle install` in the `example/ios` directory before running the following command.
`bundle install` commands is responsible for installing the required dependencies for the iOS project.

```sh
yarn example ios
```

OR

```sh
yarn expo-example ios
```

Make sure your code passes TypeScript, ESLint and Prettier. Run the following to verify:

```sh
yarn typecheck
yarn lint
yarn prettier:check
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common
tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

#### Publishing the Package to npm using GitHub Actions
You can use GitHub Actions to automate the process of publishing the package to npm. Follow these steps:
1. Navigate to [release workflow](https://github.com/contentpass/react-native-contentpass/actions/workflows/release.yml) on GitHub.
2. Run the workflow manually:
   - Click on the `Run workflow` button.
   - Select the `main` branch.
   - Confirm and execute the workflow.

This process will handle the publication of the package to npm using the configurations defined in the workflow.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
