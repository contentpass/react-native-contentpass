const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');

const packagesRoot = path.resolve(__dirname, '..', '..', 'packages');
const packagePath = (name) => path.resolve(packagesRoot, name);

const workspacePackages = [
  packagePath('react-native-contentpass'),
  packagePath('react-native-contentpass-ui'),
  packagePath('react-native-contentpass-cmp-onetrust'),
];

const baseConfig = {
  presets: ['module:@react-native/babel-preset'],
};

const overrides = workspacePackages.flatMap((root) => {
  const config = getConfig(baseConfig, { root });
  return config.overrides || [];
});

module.exports = {
  ...baseConfig,
  overrides,
};
