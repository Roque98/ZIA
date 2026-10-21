import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginBrowser } from '@/auth/login-browser';
import { createPkce } from '@/auth/pkce';
import { exchangeCode } from '@/api';
import { ZiaMark } from '@/components/zia-mark';
import { AppText, BootScreen } from '@/components/ui';
import { authorizeUrl, oauthErrorMessage, parseConsoleRedirect } from '@/oauth';
import { useSession } from '@/session';
import { colors, space } from '@/theme';

type Pending = {
  url: string;
  verifier: string;
  state: string;
};

export default function LoginScreen() {
  const { session, isLoading, signInWithToken } = useSession();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <BootScreen />;
  if (session) return <Redirect href="/" />;

  async function start() {
    setError(null);
    setSubmitting(true);
    try {
      const pkce = await createPkce();
      setPending({
        url: authorizeUrl(pkce.challenge, pkce.state),
        verifier: pkce.verifier,
        state: pkce.state,
      });
    } catch {
      setError('No se pudo preparar el acceso.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onResult(url: string) {
    const current = pending;
    setPending(null);
    if (!current) return;
    const result = parseConsoleRedirect(url);
    if (!result || result.error || !result.code) {
      setError(oauthErrorMessage(result?.error, result?.errorDescription));
      return;
    }
    if (result.state && result.state !== current.state) {
      setError('La respuesta de acceso no corresponde a esta solicitud.');
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await exchangeCode(result.code, current.verifier);
      await signInWithToken(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={styles.brand}>
          <ZiaMark size={84} />
          <AppText weight="800" color={colors.white} style={styles.wordmark}>
            ZIA
          </AppText>
          <AppText weight="600" color={colors.tealSoft} style={styles.integracion}>
            Integración
          </AppText>
          <AppText color="rgba(255,255,255,0.72)" style={styles.slogan}>
            Su aliado estratégico en el sector gasolinero
          </AppText>
        </View>

        <View style={styles.panel}>
          <AppText weight="800" style={styles.title}>
            Consola
          </AppText>
          <AppText color={colors.muted} style={styles.copy}>
            Entra con la misma cuenta de console.ziacentro.mx. El acceso lo hace el servidor de ZIA: aquí no se
            guarda la contraseña.
          </AppText>
          {error ? (
            <AppText color={colors.red} style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={submitting || Platform.OS === 'web'}
            onPress={() => {
              void start();
            }}
            style={[styles.button, (submitting || Platform.OS === 'web') && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText weight="800" color={colors.white}>
                Iniciar sesión
              </AppText>
            )}
          </Pressable>
          {Platform.OS === 'web' ? <LoginBrowser url="" onCancel={() => undefined} onResult={() => undefined} /> : null}
        </View>
      </ScrollView>
      {pending && Platform.OS !== 'web' ? (
        <LoginBrowser
          url={pending.url}
          onCancel={() => setPending(null)}
          onResult={(url) => {
            void onResult(url);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { flexGrow: 1, paddingHorizontal: space.xl, gap: 28 },
  brand: { alignItems: 'center', gap: 4 },
  wordmark: { fontSize: 40, letterSpacing: 1, marginTop: 8 },
  integracion: { fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' },
  slogan: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: space.xl,
    gap: space.md,
  },
  title: { fontSize: 22 },
  copy: { lineHeight: 21 },
  error: { lineHeight: 20 },
  button: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
});
