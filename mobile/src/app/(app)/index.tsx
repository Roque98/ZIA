import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchDashboard } from '@/api';
import { PhoneIcon } from '@/components/icons';
import { AppText, Card, ErrorBlock, Eyebrow, LevelPill, LoadingBlock, Meter, ScoreRing, levelColor } from '@/components/ui';
import { ZiaMark } from '@/components/zia-mark';
import { REGULATORS, average, daysUntil, dueLabel, greeting, levelFor, statusLabel } from '@/format';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/session';
import { colors, space } from '@/theme';
import type { Deadline, Station, Tramite } from '@/types';

export default function HomeScreen() {
  const { session } = useSession();
  const load = useCallback((token: string) => fetchDashboard(token), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando su cuenta" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  const score = average(data.stations.map((station) => station.score));
  const attention = data.deadlines
    .filter((item) => daysUntil(item.due) <= 30)
    .slice()
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);
  const active = data.tramites.filter((item) => item.status !== 'listo').slice(0, 3);
  const user = session?.user;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <ZiaMark size={28} />
          <AppText weight="800" color={colors.white} style={styles.brand}>
            ZIA
          </AppText>
        </View>
        <Eyebrow light>{greeting()}</Eyebrow>
        <AppText weight="800" color={colors.white} style={styles.name}>
          {user?.firstName ?? 'Cliente'}
        </AppText>
        <AppText color="rgba(255,255,255,0.72)" style={styles.role}>
          {user?.role} · {user?.company}
        </AppText>
      </View>

      <View style={styles.body}>
        <Card>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCopy}>
              <Eyebrow>Cumplimiento del grupo</Eyebrow>
              <AppText weight="800" style={styles.scoreWord}>
                {score}%
              </AppText>
              <AppText color={colors.muted} style={styles.scoreHint}>
                Promedio de {data.stations.length} estaciones ante ASEA, CNE, SAT, STPS y Protección Civil.
              </AppText>
            </View>
            <ScoreRing score={score} />
          </View>
          <View style={styles.regRow}>
            {(['asea', 'cne', 'sat', 'stps', 'pc'] as const).map((id) => {
              const scores = data.stations.map(
                (station) => station.regulators.find((item) => item.id === id)?.score ?? 0,
              );
              const value = average(scores);
              return (
                <View key={id} style={styles.regCell}>
                  <AppText weight="800" style={[styles.regAbbr, { color: REGULATORS[id].color }]}>
                    {REGULATORS[id].abbr}
                  </AppText>
                  <AppText weight="700" style={styles.regScore}>
                    {value}
                  </AppText>
                  <Meter score={value} color={REGULATORS[id].color} />
                </View>
              );
            })}
          </View>
        </Card>

        <View style={styles.sectionHead}>
          <AppText weight="800" style={styles.sectionTitle}>
            Requiere atención
          </AppText>
          <Link href="/vencimientos">
            <AppText weight="700" color={colors.teal}>
              Agenda
            </AppText>
          </Link>
        </View>
        <View style={styles.stack}>
          {attention.map((item) => (
            <DeadlineRow key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText weight="800" style={styles.sectionTitle}>
            Estaciones
          </AppText>
          <Link href="/estaciones">
            <AppText weight="700" color={colors.teal}>
              Ver todas
            </AppText>
          </Link>
        </View>
        <View style={styles.stack}>
          {data.stations
            .slice()
            .sort((a, b) => a.score - b.score)
            .map((station) => (
              <StationRow key={station.id} station={station} />
            ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText weight="800" style={styles.sectionTitle}>
            Trámites en curso
          </AppText>
          <Link href="/tramites">
            <AppText weight="700" color={colors.teal}>
              Ver todos
            </AppText>
          </Link>
        </View>
        <View style={styles.stack}>
          {active.map((item) => (
            <TramiteRow key={item.id} item={item} />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Linking.openURL('tel:6641594369');
          }}
          style={styles.office}
        >
          <PhoneIcon color={colors.teal} />
          <View style={styles.officeCopy}>
            <AppText weight="700">Oficina Centro · Tijuana</AppText>
            <AppText color={colors.muted} style={styles.officePhone}>
              664 159 4369
            </AppText>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DeadlineRow({ item }: { item: Deadline }) {
  const late = daysUntil(item.due) < 0;
  const body = (
    <View style={styles.row}>
      <View style={[styles.tick, { backgroundColor: REGULATORS[item.authority].color }]} />
      <View style={styles.rowCopy}>
        <AppText weight="700">{item.title}</AppText>
        <AppText color={colors.muted} style={styles.meta}>
          {item.stationName} · {REGULATORS[item.authority].abbr}
        </AppText>
      </View>
      <AppText weight="700" color={late ? colors.red : colors.ink} style={styles.due}>
        {dueLabel(item.due)}
      </AppText>
    </View>
  );
  if (!item.tramiteId) return <View style={styles.plainRow}>{body}</View>;
  return (
    <Link
      href={{ pathname: '/tramites/[id]', params: { id: item.tramiteId } }}
      asChild
    >
      <Pressable accessibilityRole="button" style={styles.plainRow}>
        {body}
      </Pressable>
    </Link>
  );
}

function StationRow({ station }: { station: Station }) {
  return (
    <Link href={{ pathname: '/estaciones/[id]', params: { id: station.id } }} asChild>
      <Pressable accessibilityRole="button" style={styles.plainRow}>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <AppText weight="700">{station.name}</AppText>
            <AppText color={colors.muted} style={styles.meta}>
              {station.city}, {station.state}
            </AppText>
            <Meter score={station.score} />
          </View>
          <View style={styles.scoreSide}>
            <AppText weight="800" style={{ color: levelColor(levelFor(station.score)) }}>
              {station.score}
            </AppText>
            <LevelPill level={levelFor(station.score)} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function TramiteRow({ item }: { item: Tramite }) {
  return (
    <Link href={{ pathname: '/tramites/[id]', params: { id: item.id } }} asChild>
      <Pressable accessibilityRole="button" style={styles.plainRow}>
        <View style={styles.row}>
          <View style={[styles.tick, { backgroundColor: REGULATORS[item.authority].color }]} />
          <View style={styles.rowCopy}>
            <AppText weight="700">{item.title}</AppText>
            <AppText color={colors.muted} style={styles.meta}>
              {item.stationName} · {statusLabel(item.status)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 28 },
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  brand: { letterSpacing: 1.5, fontSize: 16 },
  name: { fontSize: 34, lineHeight: 38 },
  role: { fontSize: 14, lineHeight: 20 },
  body: { marginTop: -22, paddingHorizontal: 16, gap: 14 },
  scoreRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  scoreCopy: { flex: 1, gap: 4 },
  scoreWord: { fontSize: 28 },
  scoreHint: { fontSize: 13, lineHeight: 18 },
  regRow: { flexDirection: 'row', gap: 8 },
  regCell: { flex: 1, gap: 4 },
  regAbbr: { fontSize: 10, letterSpacing: 0.3 },
  regScore: { fontSize: 13 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  sectionTitle: { fontSize: 18 },
  stack: { gap: 8 },
  plainRow: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowCopy: { flex: 1, gap: 3 },
  tick: { width: 4, alignSelf: 'stretch', borderRadius: 99 },
  meta: { fontSize: 12 },
  due: { fontSize: 12, maxWidth: 108, textAlign: 'right' },
  scoreSide: { alignItems: 'flex-end', gap: 6 },
  office: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  officeCopy: { gap: 2 },
  officePhone: { fontSize: 13 },
});
