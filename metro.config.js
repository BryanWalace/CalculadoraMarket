const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Os testes ficam junto das telas dentro de app/ (ex.: app/index.test.tsx),
// mas o expo-router trata tudo em app/ como rota em potencial — sem isso, o
// bundle de produção tenta empacotar @testing-library/react-native e quebra.
config.resolver.blockList = [...config.resolver.blockList, /\.test\.[jt]sx?$/];

module.exports = config;
