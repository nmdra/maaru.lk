const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
// const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable Metro cache reset
config.resetCache = true;

// Mock react-native-keyboard-controller for Expo Go compatibility (optional)
/* config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-keyboard-controller') {
    return {
      filePath: path.resolve(__dirname, 'react-native-keyboard-controller-mock.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
}; */

module.exports = withNativeWind(config, { input: './global.css' });