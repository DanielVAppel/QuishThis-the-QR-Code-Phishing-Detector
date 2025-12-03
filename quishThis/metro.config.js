// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

// Polyfill URL.canParse for Node.js v20.11.1
if (!URL.canParse) {
  URL.canParse = function(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
}

const config = getDefaultConfig(__dirname);

module.exports = config;