import type { ExpoConfig } from 'expo/config';

/**
 * ClaimIt — app config.
 * Env vars come from .env (loaded via metro.config.js for the JS bundle, and
 * process.env here for native builds). Never commit real keys.
 */
const config: ExpoConfig = {
  name: 'ClaimIt',
  slug: 'claimit',
  scheme: 'claimit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',

  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.claimit.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'ClaimIt uses the camera to scan QR tags so staff can verify and release items.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#208AEF',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    // Mirror of the EXPO_PUBLIC_* vars, readable via Constants.expoConfig.extra
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
    },
  },
};

export default config;
