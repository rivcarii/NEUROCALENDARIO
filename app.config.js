// Configuración dinámica: en GitHub Pages la web vive en /NEUROCALENDARIO (EXPO_BASE_URL lo fija el flujo de publicación).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
