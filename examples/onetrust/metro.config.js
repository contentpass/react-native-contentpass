const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const fs = require('fs');

const packagesRoot = path.resolve(__dirname, '..', '..', 'packages');
const packagePath = (name) => path.resolve(packagesRoot, name);

const workspacePackages = [
  {
    name: '@contentpass/react-native-contentpass',
    root: packagePath('react-native-contentpass'),
  },
  {
    name: '@contentpass/react-native-contentpass-ui',
    root: packagePath('react-native-contentpass-ui'),
  },
  {
    name: '@contentpass/react-native-contentpass-cmp-onetrust',
    root: packagePath('react-native-contentpass-cmp-onetrust'),
  },
];

const config = getDefaultConfig(__dirname);

// Add watch folders for workspace packages
config.watchFolders = [
  ...(config.watchFolders || []),
  ...workspacePackages.map(({ root }) => root),
];

// Configure resolver to handle workspace dependencies
const exampleNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '..', '..', 'node_modules');
const libraryNodeModules = path.join(
  packagePath('react-native-contentpass'),
  'node_modules'
);
const workspaceExtraNodeModules = Object.fromEntries(
  workspacePackages.map(({ name, root }) => [name, root])
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
    exampleNodeModules,
    rootNodeModules,
    libraryNodeModules,
    ...(config.resolver?.nodeModulesPaths || []),
  ],
  // Prefer package "source" for workspace packages to avoid requiring a build step.
  resolverMainFields: ['source', 'react-native', 'browser', 'main'],
  // Disable package exports to allow "source" to be resolved in workspaces.
  unstable_enablePackageExports: false,
};

module.exports = config;
