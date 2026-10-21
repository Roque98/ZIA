const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const preview = process.env.EXPO_PUBLIC_STORE_PREVIEW === '1';

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    !preview &&
    (moduleName === '@/preview-data' || moduleName === './preview-data' || moduleName.endsWith('/preview-data'))
  ) {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'src/preview-empty.ts'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
