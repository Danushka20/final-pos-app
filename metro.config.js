const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const defaultConfig = getDefaultConfig(__dirname);
const reactDomShim = path.resolve(__dirname, 'src/shims/react-dom.js');

const config = mergeConfig(defaultConfig, {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
        return {
          filePath: reactDomShim,
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
