// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const workspacePath = (name) => path.resolve(workspaceRoot, name);

const workspacePackages = [
  {
    name: '@contentpass/react-native-contentpass',
    root: workspacePath('packages/react-native-contentpass'),
  },
  {
    name: '@contentpass/react-native-contentpass-ui',
    root: workspacePath('packages/react-native-contentpass-ui'),
  },
  {
    name: '@contentpass/examples-sourcepoint-shared',
    root: workspacePath('examples/sourcepoint-shared'),
  },
];

const pkg = require('../../packages/react-native-contentpass/package.json');
const root = path.resolve(__dirname, '..', '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
});

// Add watch folders for workspace packages
config.watchFolders = [
  ...(config.watchFolders || []),
  ...workspacePackages.flatMap(({ root }) => [path.join(root, 'src'), root]),
];

// Configure resolver to handle workspace dependencies
const exampleNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '..', '..', 'node_modules');
const libraryNodeModules = path.join(
  workspacePath('packages/react-native-contentpass'),
  'node_modules'
);
const workspaceExtraNodeModules = Object.fromEntries(
  workspacePackages.map(({ name, root }) => [name, path.join(root, 'src')])
);

config.resolver = {
  ...config.resolver,
  // Prevent Metro from walking up the directory tree and picking nested node_modules
  // which can cause duplicate module instances in monorepos.
  disableHierarchicalLookup: true,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    // Force React and React Native to resolve to the example's node_modules
    // This prevents multiple React instances (common issue in monorepos)
    'react': path.join(exampleNodeModules, 'react'),
    'react-native': path.join(exampleNodeModules, 'react-native'),
    // Map workspace packages to their source directories
    ...workspaceExtraNodeModules,
  },
  // Add node_modules paths for workspace resolution
  // Order matters - check example's node_modules first, then root, then library
  nodeModulesPaths: [
    exampleNodeModules, // Example's own node_modules (for @babel/runtime) - CHECK FIRST
    rootNodeModules, // Root node_modules (for workspace dependencies)
    libraryNodeModules, // Library's node_modules (for react-native-uuid, etc.)
    ...(config.resolver?.nodeModulesPaths || []),
  ],
};

module.exports = config;
