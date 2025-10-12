module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
    plugins: [
      'react-native-worklets/plugin',    // ✅ required by expo-router
      'react-native-reanimated/plugin'   // ✅ must be last
    ],
  };
};