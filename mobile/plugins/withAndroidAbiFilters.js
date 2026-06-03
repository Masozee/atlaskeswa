const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Sets abiFilters in app/build.gradle to restrict which native ABIs are bundled.
 * arm64-v8a covers all Android phones since ~2015. x86/x86_64/armeabi-v7a add
 * ~35 MB of native libs that are only needed for emulators or old 32-bit devices.
 */
module.exports = function withAndroidAbiFilters(config, abiFilters = ['arm64-v8a']) {
  return withAppBuildGradle(config, (config) => {
    const filters = abiFilters.map((a) => `"${a}"`).join(', ');
    config.modResults.contents = config.modResults.contents.replace(
      /ndk\s*\{[^}]*\}/s,
      `ndk {\n            abiFilters ${filters}\n        }`
    );
    return config;
  });
};
