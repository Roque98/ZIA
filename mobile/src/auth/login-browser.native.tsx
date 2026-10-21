import { useRef } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { colors, space } from '@/theme';

type Props = {
  url: string;
  onCancel: () => void;
  onResult: (url: string) => void;
};

export function LoginBrowser({ url, onCancel, onResult }: Props) {
  const insets = useSafeAreaInsets();
  const handled = useRef(false);

  function take(nextUrl: string): boolean {
    let host = '';
    try {
      host = new URL(nextUrl).hostname;
    } catch {
      return false;
    }
    if (host !== 'console.ziacentro.mx') return false;
    if (handled.current) return true;
    handled.current = true;
    onResult(nextUrl);
    return true;
  }

  function onShouldStart(request: ShouldStartLoadRequest): boolean {
    return !take(request.url);
  }

  function onNav(nav: WebViewNavigation) {
    take(nav.url);
  }

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <View style={styles.barCopy}>
            <AppText weight="800">Cuenta ZIA</AppText>
            <AppText color={colors.muted} numberOfLines={1} style={styles.host}>
              api.ziacentro.mx
            </AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar acceso" onPress={onCancel} hitSlop={8}>
            <AppText weight="800" color={colors.teal}>
              Cancelar
            </AppText>
          </Pressable>
        </View>
        <WebView
          source={{ uri: url }}
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={onNav}
          startInLoadingState
          incognito
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.teal} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  barCopy: { flex: 1 },
  host: { fontSize: 12 },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
});
