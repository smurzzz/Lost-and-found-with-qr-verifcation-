/**
 * Metro config for ClaimIt.
 * SDK 57's Metro no longer auto-loads .env files, so we load them here with
 * dotenv: EXPO_PUBLIC_* vars get inlined into the JS bundle at build time.
 * Order matters — later calls win, so local overrides beat committed defaults.
 */
const { getDefaultConfig } = require('expo/metro-config');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const config = getDefaultConfig(__dirname);

module.exports = config;
