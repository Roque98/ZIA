import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
void SystemUI.setBackgroundColorAsync(colors.ink);

export default function RootLayout() {
  const [loaded, error] = useFonts([
    {
      fontFamily: 'MonaSans',
      fontDefinitions: [
        { path: require('../../assets/fonts/MonaSans-Regular.ttf'), weight: 400, style: 'normal' },
        { path: require('../../assets/fonts/MonaSans-Medium.ttf'), weight: 500, style: 'normal' },
        { path: require('../../assets/fonts/MonaSans-SemiBold.ttf'), weight: 600, style: 'normal' },
        { path: require('../../assets/fonts/MonaSans-Bold.ttf'), weight: 700, style: 'normal' },
        { path: require('../../assets/fonts/MonaSans-ExtraBold.ttf'), weight: 800, style: 'normal' },
      ],
    },
  ]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Frame>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }} />
        </Frame>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const storePreview = process.env.EXPO_PUBLIC_STORE_PREVIEW === '1';

function Frame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web' || storePreview) {
    return <View style={styles.native}>{children}</View>;
  }
  return (
    <View style={styles.webOuter}>
      <View style={styles.webPhone}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  native: { flex: 1 },
  webOuter: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  webPhone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.paper,
  },
});
