import { ActivityIndicator, Pressable, StyleSheet, Text, type TextProps, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { levelFor, levelLabel } from '@/format';
import { colors, space } from '@/theme';
import type { Level } from '@/types';

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

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = levelColor(levelFor(score));
  const offset = circumference * (1 - Math.max(0, Math.min(score, 100)) / 100);

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`Cumplimiento ${score} por ciento`}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.tealSoft}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringLabel} pointerEvents="none">
        <AppText weight="800" style={styles.ringValue}>
          {score}
        </AppText>
      </View>
    </View>
  );
}

export function Meter({ score, color }: { score: number; color?: string }) {
  const width = `${Math.max(0, Math.min(score, 100))}%` as const;
  return (
    <View style={styles.meter}>
      <View style={[styles.meterFill, { width, backgroundColor: color ?? levelColor(levelFor(score)) }]} />
    </View>
  );
}

export function LevelPill({ level }: { level: Level }) {
  const color = levelColor(level);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <AppText weight="700" color={color} style={styles.pillText}>
        {levelLabel(level)}
      </AppText>
    </View>
  );
}

export function levelColor(level: Level): string {
  if (level === 'al_dia') return colors.asea;
  if (level === 'atencion') return colors.cne;
  return colors.red;
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
  errorTitle: { fontSize: 18 },
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
  ringLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { fontSize: 26, lineHeight: 30 },
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
});
