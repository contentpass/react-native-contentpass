const path = require('path');
const pkg = require('../../packages/react-native-contentpass/package.json');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'react-native-contentpass'
      ),
    },
  },
};
