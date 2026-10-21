import { ActivityIndicator, Pressable, StyleSheet, Text, type TextProps, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackIcon } from '@/components/icons';
import { colors, space } from '@/theme';

type Weight = '400' | '500' | '600' | '700' | '800';

type AppTextProps = TextProps & {
  weight?: Weight;
  color?: string;
};

export function AppText({ weight = '400', color, style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: 'MonaSans', fontWeight: weight, color: color ?? colors.ink }, style]}
    />
  );
}

export function BootScreen() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator color={colors.teal} />
    </View>
  );
}

export function LoadingBlock({ label = 'Cargando' }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.teal} />
      <AppText color={colors.muted}>{label}</AppText>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <AppText weight="700" style={styles.errorTitle}>
        No se pudo cargar
      </AppText>
      <AppText color={colors.muted} style={styles.errorBody}>
        {message}
      </AppText>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <AppText weight="700" color={colors.white}>
          Reintentar
        </AppText>
      </Pressable>
    </View>
  );
}

export function DeniedBlock({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.centered}>
      <AppText weight="700" style={styles.errorTitle}>
        {title}
      </AppText>
      <AppText color={colors.muted} style={styles.errorBody}>
        {body}
      </AppText>
    </View>
  );
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <AppText weight="700">{title}</AppText>
      <AppText color={colors.muted} style={styles.errorBody}>
        {body}
      </AppText>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <AppText weight="700" color={light ? colors.gold : colors.teal} style={styles.eyebrow}>
      {children}
    </AppText>
  );
}

export function Meter({ value, color }: { value: number; color?: string }) {
  const width = `${Math.max(0, Math.min(value, 100))}%` as const;
  return (
    <View style={styles.meter}>
      <View style={[styles.meterFill, { width, backgroundColor: color ?? colors.teal }]} />
    </View>
  );
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <AppText weight="700" color={color} style={styles.pillText}>
        {label}
      </AppText>
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        hitSlop={8}
        style={styles.back}
      >
        <BackIcon color={colors.ink} />
      </Pressable>
      <View style={styles.headerCopy}>
        <AppText weight="800" numberOfLines={2} style={styles.headerTitle}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color={colors.muted} numberOfLines={2} style={styles.headerSub}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    backgroundColor: colors.paper,
  },
  empty: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.sm,
  },
  errorTitle: { fontSize: 18, textAlign: 'center' },
  errorBody: { textAlign: 'center', lineHeight: 20 },
  retry: {
    marginTop: space.sm,
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.md,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  meter: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.tealSoft,
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 99 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillText: { fontSize: 11, letterSpacing: 0.2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 20, lineHeight: 24 },
  headerSub: { fontSize: 13 },
});
