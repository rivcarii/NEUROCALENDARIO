const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// expo-sqlite en web (solo para pruebas de humo en navegador) usa un módulo WebAssembly.
config.resolver.assetExts.push('wasm');
module.exports = config;
