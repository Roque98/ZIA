import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchTramite } from '@/api';
import { BackIcon } from '@/components/icons';
import { AppText, ErrorBlock, Eyebrow, LoadingBlock } from '@/components/ui';
import { REGULATORS, formatDate, statusLabel } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';

export default function TramiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tramiteId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const load = useCallback((token: string) => fetchTramite(token, tramiteId ?? ''), [tramiteId]);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando trámite" />;
  if (error && !data) return <ErrorBlock message={error} onRetry={refresh} />;
  if (!data) {
    return (
      <View style={styles.missing}>
        <AppText weight="800" style={styles.missingTitle}>
          No encontramos ese trámite
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/tramites')} style={styles.backLink}>
          <AppText weight="700" color={colors.white}>
            Volver a trámites
          </AppText>
        </Pressable>
      </View>
    );
  }

  const authority = REGULATORS[data.authority];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.white} colors={[colors.teal]} />}
    >
      <View style={styles.hero}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/tramites'))}
          style={styles.back}
        >
          <BackIcon color={colors.white} />
          <AppText weight="700" color={colors.white}>
            Trámites
          </AppText>
        </Pressable>
        <View style={[styles.badge, { backgroundColor: authority.color }]}>
          <AppText weight="800" color={colors.white} style={styles.badgeText}>
            {authority.abbr}
          </AppText>
        </View>
        <AppText weight="800" color={colors.white} style={styles.title}>
          {data.title}
        </AppText>
        <AppText color="rgba(255,255,255,0.75)">
          {data.reference} · {statusLabel(data.status)}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Eyebrow>Siguiente paso</Eyebrow>
          <AppText weight="700" style={styles.next}>
            {data.nextAction}
          </AppText>
          <AppText color={colors.muted} style={styles.summary}>
            {data.summary}
          </AppText>
          <AppText color={colors.muted} style={styles.small}>
            Actualizado {formatDate(data.updatedAt)}
          </AppText>
        </View>

        <Link href={{ pathname: '/estaciones/[id]', params: { id: data.stationId } }} asChild>
          <Pressable accessibilityRole="button" style={styles.card}>
            <Eyebrow>Estación</Eyebrow>
            <AppText weight="800" style={styles.station}>
              {data.stationName}
            </AppText>
            <AppText color={colors.teal} weight="700">
              Ver cumplimiento
            </AppText>
          </Pressable>
        </Link>

        <AppText weight="800" style={styles.section}>
          Expediente
        </AppText>
        <View style={styles.card}>
          {data.steps.map((step, index) => {
            const last = index === data.steps.length - 1;
            const done = step.state === 'hecho';
            const current = step.state === 'actual';
            return (
              <View key={step.label} style={styles.step}>
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.dot,
                      done && styles.dotDone,
                      current && styles.dotCurrent,
                    ]}
                  />
                  {!last ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.stepCopy}>
                  <AppText weight={current ? '800' : '600'} color={step.state === 'pendiente' ? colors.muted : colors.ink}>
                    {step.label}
                  </AppText>
                  <AppText color={colors.muted} style={styles.small}>
                    {done && step.date ? formatDate(step.date) : current ? 'En curso' : 'Pendiente'}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Eyebrow>Autoridad</Eyebrow>
          <AppText weight="700">{authority.name}</AppText>
          <AppText color={colors.muted} style={styles.summary}>
            {authority.short}. ZIA prepara, ingresa y da seguimiento; la estación sigue operando.
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, letterSpacing: 0.4 },
  title: { fontSize: 28, lineHeight: 32 },
  body: { marginTop: -16, paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  next: { fontSize: 16, lineHeight: 22 },
  summary: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12 },
  station: { fontSize: 18 },
  section: { fontSize: 18, marginTop: 4 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: 16, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginTop: 3,
  },
  dotDone: { backgroundColor: colors.teal, borderColor: colors.teal },
  dotCurrent: { backgroundColor: colors.gold, borderColor: colors.gold },
  line: { width: 2, flex: 1, backgroundColor: colors.line, marginTop: 2 },
  stepCopy: { flex: 1, paddingBottom: 16, gap: 2 },
  missing: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  missingTitle: { fontSize: 20, textAlign: 'center' },
  backLink: { backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
});
