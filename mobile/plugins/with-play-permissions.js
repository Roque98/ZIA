const { withAndroidManifest } = require('expo/config-plugins');

const REMOVE = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

/** Quita permisos que el prebuild de Expo deja y que esta app no usa. */
function withPlayPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = manifest.$ ?? {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const current = manifest['uses-permission'] ?? [];
    manifest['uses-permission'] = current.filter((item) => !REMOVE.includes(item.$?.['android:name']));
    for (const name of REMOVE) {
      manifest['uses-permission'].push({
        $: { 'android:name': name, 'tools:node': 'remove' },
      });
    }
    return config;
  });
}

module.exports = withPlayPermissions;
