import { Link } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchDeadlines } from '@/api';
import { AppText, ErrorBlock, Eyebrow, LoadingBlock } from '@/components/ui';
import { REGULATORS, daysUntil, dueLabel, formatDate } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { Deadline } from '@/types';

export default function VencimientosScreen() {
  const load = useCallback((token: string) => fetchDeadlines(token), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  const groups = useMemo(() => {
    const rows = (data ?? []).slice().sort((a, b) => a.due.localeCompare(b.due));
    return {
      late: rows.filter((item) => daysUntil(item.due) < 0),
      soon: rows.filter((item) => {
        const days = daysUntil(item.due);
        return days >= 0 && days <= 30;
      }),
      later: rows.filter((item) => daysUntil(item.due) > 30),
    };
  }, [data]);

  if (loading && !data) return <LoadingBlock label="Cargando agenda" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <View style={styles.hero}>
        <Eyebrow light>Seguimiento</Eyebrow>
        <AppText weight="800" color={colors.white} style={styles.title}>
          Agenda
        </AppText>
        <AppText color="rgba(255,255,255,0.72)">
          Obligaciones periódicas antes de que se conviertan en un hallazgo.
        </AppText>
      </View>
      <View style={styles.body}>
        <Group title="Vencidos" tint={colors.red} items={groups.late} empty="Nada vencido." />
        <Group title="Próximos 30 días" tint={colors.cne} items={groups.soon} empty="Nada en los próximos 30 días." />
        <Group title="Más adelante" tint={colors.teal} items={groups.later} empty="Sin fechas posteriores." />
      </View>
    </ScrollView>
  );
}

function Group({
  title,
  tint,
  items,
  empty,
}: {
  title: string;
  tint: string;
  items: Deadline[];
  empty: string;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <View style={[styles.groupDot, { backgroundColor: tint }]} />
        <AppText weight="800" style={styles.groupTitle}>
          {title}
        </AppText>
        <AppText weight="700" color={colors.muted}>
          {items.length}
        </AppText>
      </View>
      {items.length === 0 ? (
        <AppText color={colors.muted}>{empty}</AppText>
      ) : (
        items.map((item) => <DeadlineCard key={item.id} item={item} />)
      )}
    </View>
  );
}

function DeadlineCard({ item }: { item: Deadline }) {
  const late = daysUntil(item.due) < 0;
  const inner = (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.authority, { backgroundColor: REGULATORS[item.authority].color }]}>
          <AppText weight="800" color={colors.white} style={styles.authorityText}>
            {REGULATORS[item.authority].abbr}
          </AppText>
        </View>
        <AppText weight="700" color={late ? colors.red : colors.ink} style={styles.due}>
          {dueLabel(item.due)}
        </AppText>
      </View>
      <AppText weight="800" style={styles.cardTitle}>
        {item.title}
      </AppText>
      <AppText color={colors.muted}>
        {item.stationName} · {formatDate(item.due)}
      </AppText>
      <AppText color={colors.muted} style={styles.note}>
        {item.note}
      </AppText>
    </View>
  );

  if (!item.tramiteId) return inner;
  return (
    <Link href={{ pathname: '/tramites/[id]', params: { id: item.tramiteId } }} asChild>
      <Pressable accessibilityRole="button">{inner}</Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 28 },
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 4,
  },
  title: { fontSize: 32, lineHeight: 36 },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 22 },
  group: { gap: 10 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 99 },
  groupTitle: { fontSize: 18, flex: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  authority: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  authorityText: { fontSize: 11, letterSpacing: 0.4 },
  due: { fontSize: 12, maxWidth: 140, textAlign: 'right' },
  cardTitle: { fontSize: 16, lineHeight: 21 },
  note: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
