const APP_VARIANT =
  process.env.APP_VARIANT === "development" ? "development" : "production";

const isDevelopmentVariant = APP_VARIANT === "development";
const appName = isDevelopmentVariant ? "Tunenova (Dev)" : "Tunenova";
const iosBundleIdentifier = isDevelopmentVariant
  ? "com.caribou97499.tunenova.dev"
  : "com.caribou97499.tunenova";

module.exports = () => ({
  expo: {
    name: appName,
    slug: "tunenova",
    version: "2.2.5",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "tunenova",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: false,
      bundleIdentifier: iosBundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: appName,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#000000",
      },
      googleServicesFile: "./google-services.json",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
      package: "com.caribou97499.tunenova",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-dev-client",
        {
          addGeneratedScheme: isDevelopmentVariant,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
        },
      ],
      "expo-asset",
      "expo-image",
      "expo-secure-store",
      "expo-audio",
      "expo-notifications",
      "expo-web-browser",
      "@react-native-community/datetimepicker",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      appVariant: APP_VARIANT,
      eas: {
        projectId: "de9ef734-5b45-4bcd-8836-ff073aebf417",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/de9ef734-5b45-4bcd-8836-ff073aebf417",
      checkAutomatically: "ON_LOAD",
      enabled: true,
    },
  },
});
