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
    name: '@contentpass/react-native-contentpass-cmp-consentmanager',
    root: workspacePath('packages/react-native-contentpass-cmp-consentmanager'),
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

config.watchFolders = [
  ...(config.watchFolders || []),
  ...workspacePackages.flatMap(({ root }) => [path.join(root, 'src'), root]),
];

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
  disableHierarchicalLookup: true,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    'react': path.join(exampleNodeModules, 'react'),
    'react-native': path.join(exampleNodeModules, 'react-native'),
    ...workspaceExtraNodeModules,
  },
  nodeModulesPaths: [
    exampleNodeModules,
    rootNodeModules,
    libraryNodeModules,
    ...(config.resolver?.nodeModulesPaths || []),
  ],
  unstable_enablePackageExports: false,
};

module.exports = config;
