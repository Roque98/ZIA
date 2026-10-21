import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchDeadlines, fetchStation, fetchTramites } from '@/api';
import { BackIcon } from '@/components/icons';
import { AppText, ErrorBlock, Eyebrow, LevelPill, LoadingBlock, Meter, ScoreRing } from '@/components/ui';
import { REGULATORS, dueLabel, levelFor, statusLabel } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { Deadline, Station, Tramite } from '@/types';

type Detail = {
  station: Station | null;
  tramites: Tramite[];
  deadlines: Deadline[];
};

export default function EstacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const load = useCallback(
    async (token: string): Promise<Detail> => {
      const [station, allTramites, allDeadlines] = await Promise.all([
        fetchStation(token, stationId ?? ''),
        fetchTramites(token),
        fetchDeadlines(token),
      ]);
      if (!station) return { station: null, tramites: [], deadlines: [] };
      return {
        station,
        tramites: allTramites.filter((item) => item.stationId === station.id),
        deadlines: allDeadlines
          .filter((item) => item.stationId === station.id)
          .slice()
          .sort((a, b) => a.due.localeCompare(b.due)),
      };
    },
    [stationId],
  );
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando estación" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;
  if (!data.station) {
    return (
      <View style={styles.missing}>
        <AppText weight="800" style={styles.missingTitle}>
          No encontramos esa estación
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/estaciones')} style={styles.backLink}>
          <AppText weight="700" color={colors.white}>
            Volver a estaciones
          </AppText>
        </Pressable>
      </View>
    );
  }

  const station = data.station;
  const relatedTramites = data.tramites;
  const relatedDeadlines = data.deadlines;

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
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/estaciones'))}
          style={styles.back}
        >
          <BackIcon color={colors.white} />
          <AppText weight="700" color={colors.white}>
            Estaciones
          </AppText>
        </Pressable>
        <Eyebrow light>{station.permit}</Eyebrow>
        <AppText weight="800" color={colors.white} style={styles.title}>
          {station.name}
        </AppText>
        <AppText color="rgba(255,255,255,0.75)">
          {station.address}
          {'\n'}
          {station.city}, {station.state}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreCopy}>
            <Eyebrow>Cumplimiento</Eyebrow>
            <AppText weight="800" style={styles.scoreWord}>
              {station.score}%
            </AppText>
            <LevelPill level={levelFor(station.score)} />
          </View>
          <ScoreRing score={station.score} size={84} />
        </View>

        <AppText weight="800" style={styles.section}>
          Reguladores
        </AppText>
        {station.regulators.map((item) => (
          <View key={item.id} style={styles.block}>
            <View style={styles.blockTop}>
              <View style={styles.blockCopy}>
                <AppText weight="800" style={{ color: REGULATORS[item.id].color }}>
                  {REGULATORS[item.id].abbr}
                </AppText>
                <AppText color={colors.muted} style={styles.small}>
                  {REGULATORS[item.id].short}
                </AppText>
              </View>
              <AppText weight="800">{item.score}</AppText>
            </View>
            <Meter score={item.score} color={REGULATORS[item.id].color} />
            <AppText color={colors.muted} style={styles.note}>
              {item.note}
            </AppText>
          </View>
        ))}

        <AppText weight="800" style={styles.section}>
          Puntos de la estación
        </AppText>
        {station.points.map((point) => (
          <View key={point.id} style={styles.block}>
            <View style={styles.blockTop}>
              <View style={styles.blockCopy}>
                <AppText weight="700">{point.label}</AppText>
                <AppText color={colors.muted} style={styles.small}>
                  {point.title}
                </AppText>
              </View>
              <LevelPill level={point.level} />
            </View>
            <AppText color={colors.muted} style={styles.note}>
              {point.note}
            </AppText>
          </View>
        ))}

        {relatedTramites.length > 0 ? (
          <>
            <AppText weight="800" style={styles.section}>
              Trámites de esta estación
            </AppText>
            {relatedTramites.map((item) => (
              <Link key={item.id} href={{ pathname: '/tramites/[id]', params: { id: item.id } }} asChild>
                <Pressable accessibilityRole="button" style={styles.block}>
                  <AppText weight="700">{item.title}</AppText>
                  <AppText color={colors.muted} style={styles.small}>
                    {REGULATORS[item.authority].abbr} · {statusLabel(item.status)}
                  </AppText>
                </Pressable>
              </Link>
            ))}
          </>
        ) : null}

        {relatedDeadlines.length > 0 ? (
          <>
            <AppText weight="800" style={styles.section}>
              Vencimientos
            </AppText>
            {relatedDeadlines.map((item) => (
              <View key={item.id} style={styles.block}>
                <AppText weight="700">{item.title}</AppText>
                <AppText color={colors.muted} style={styles.small}>
                  {REGULATORS[item.authority].abbr} · {dueLabel(item.due)}
                </AppText>
              </View>
            ))}
          </>
        ) : null}
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
    paddingBottom: 36,
    gap: 6,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8, alignSelf: 'flex-start' },
  title: { fontSize: 30, lineHeight: 34 },
  body: { marginTop: -18, paddingHorizontal: 16, gap: 10 },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreCopy: { flex: 1, gap: 6 },
  scoreWord: { fontSize: 32 },
  section: { fontSize: 18, marginTop: 10 },
  block: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 8,
  },
  blockTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  blockCopy: { flex: 1, gap: 2 },
  small: { fontSize: 12 },
  note: { fontSize: 14, lineHeight: 20 },
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
