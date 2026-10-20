const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// expo-sqlite en web (solo para pruebas de humo en navegador) usa un módulo WebAssembly.
config.resolver.assetExts.push('wasm');
// pdf-lib (informe en PDF para el navegador) usa tslib 1.x: Metro tomaba su versión ESM, que no trae export por defecto.
// Se fuerza la versión CommonJS que está junto a pdf-lib.
const path = require('node:path');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib' && context.originModulePath.includes(`${path.sep}pdf-lib${path.sep}`)) {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'node_modules', 'pdf-lib', 'node_modules', 'tslib', 'tslib.js') };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};
module.exports = config;
