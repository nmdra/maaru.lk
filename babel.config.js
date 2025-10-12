process.env.EXPO_CSS_INTEROP_NO_WORKLETS = '1';

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],
  };
}