module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  env: {
    // F-05 fix: strip every console.log / warn / info / debug / error call
    // from release Hermes bundles at build time. Metro sets NODE_ENV=production
    // when generating the release JS bundle, which activates this env block.
    // Debug builds keep console calls so on-device debugging still works.
    production: {
      plugins: [
        ['transform-remove-console', { exclude: [] }],
      ],
    },
  },
};
