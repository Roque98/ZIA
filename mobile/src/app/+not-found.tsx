import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, space } from '@/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <AppText weight="800" color={colors.white} style={styles.title}>
          Esta pantalla no existe
        </AppText>
        <Link href="/" style={styles.link}>
          <AppText weight="700" color={colors.ink}>
            Volver al inicio
          </AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: space.xl,
  },
  title: { fontSize: 22, textAlign: 'center' },
  link: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
