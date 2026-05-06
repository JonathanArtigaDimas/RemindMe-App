const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve chrono-node to its CJS build because Metro doesn't support
// the "exports" field in package.json by default.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'chrono-node': path.resolve(__dirname, 'node_modules/chrono-node/dist/cjs/index.js'),
};

module.exports = config;
