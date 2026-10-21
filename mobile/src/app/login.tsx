import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEMO_EMAIL, DEMO_PASSWORD } from '@/api';
import { ZiaMark } from '@/components/zia-mark';
import { AppText, BootScreen } from '@/components/ui';
import { useSession } from '@/session';
import { colors, space } from '@/theme';

export default function LoginScreen() {
  const { session, isLoading, signIn } = useSession();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <BootScreen />;
  if (session) return <Redirect href="/" />;

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
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

        <View style={styles.form}>
          <Field label="Correo">
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              textContentType="emailAddress"
              placeholder="correo@estacion.mx"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              accessibilityLabel="Correo"
            />
          </Field>
          <Field label="Contraseña">
            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                placeholder="Contraseña"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={[styles.input, styles.passwordInput]}
                accessibilityLabel="Contraseña"
                onSubmitEditing={() => {
                  void onSubmit();
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.reveal}
              >
                <AppText weight="700" color={colors.gold} style={styles.revealText}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </AppText>
              </Pressable>
            </View>
          </Field>

          {error ? (
            <AppText color={colors.red} style={styles.error} accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => {
              void onSubmit();
            }}
            style={({ pressed }) => [styles.submit, pressed && styles.pressed, submitting && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText weight="700" color={colors.white} style={styles.submitText}>
                Entrar
              </AppText>
            )}
          </Pressable>
        </View>

        <View style={styles.demo}>
          <AppText weight="800" color={colors.gold} style={styles.demoKicker}>
            Acceso de demostración
          </AppText>
          <AppText color="rgba(255,255,255,0.78)" style={styles.demoBody}>
            Este repositorio no incluye servicio de autenticación. La sesión se guarda en el
            dispositivo y los expedientes son ficticios.
          </AppText>
          <AppText color={colors.white} style={styles.credential}>
            {DEMO_EMAIL}
          </AppText>
          <AppText color={colors.white} style={styles.credential}>
            {DEMO_PASSWORD}
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText weight="700" color="rgba(255,255,255,0.7)" style={styles.label}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { flexGrow: 1, paddingHorizontal: 22, gap: 22 },
  brand: { alignItems: 'center', gap: 6 },
  wordmark: { fontSize: 36, letterSpacing: 3, marginTop: 8 },
  integracion: { fontSize: 14, letterSpacing: 2.4, textTransform: 'uppercase', marginTop: -4 },
  slogan: { textAlign: 'center', lineHeight: 21, marginTop: 8, maxWidth: 280 },
  form: { gap: space.md },
  field: { gap: 6 },
  label: { fontSize: 12, letterSpacing: 0.4 },
  input: {
    backgroundColor: colors.inkRaised,
    borderWidth: 1,
    borderColor: '#2c4c50',
    borderRadius: 14,
    color: colors.white,
    fontFamily: 'MonaSans',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  passwordInput: { paddingRight: 84 },
  reveal: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  revealText: { fontSize: 13 },
  error: { fontSize: 14, lineHeight: 20 },
  submit: {
    backgroundColor: colors.teal,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: { fontSize: 16 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.7 },
  demo: {
    borderWidth: 1,
    borderColor: 'rgba(166,145,64,0.45)',
    backgroundColor: 'rgba(166,145,64,0.08)',
    borderRadius: 16,
    padding: space.lg,
    gap: 6,
  },
  demoKicker: { fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
  demoBody: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  credential: { fontSize: 14, fontFamily: 'MonaSans', fontWeight: '700' },
});
