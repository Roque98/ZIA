import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchTramites } from '@/api';
import { AppText, ErrorBlock, Eyebrow, LoadingBlock } from '@/components/ui';
import { REGULATORS, formatDate, statusLabel } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { TramiteStatus } from '@/types';

const FILTERS: { id: 'todos' | 'curso' | 'autoridad' | 'listo'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'curso', label: 'En curso' },
  { id: 'autoridad', label: 'En autoridad' },
  { id: 'listo', label: 'Listos' },
];

function matches(status: TramiteStatus, filter: (typeof FILTERS)[number]['id']): boolean {
  if (filter === 'todos') return true;
  if (filter === 'curso') return status === 'en_gestoria' || status === 'en_revision';
  if (filter === 'autoridad') return status === 'esperando_autoridad';
  return status === 'listo';
}

export default function TramitesScreen() {
  const load = useCallback((token: string) => fetchTramites(token), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todos');

  const rows = useMemo(
    () => (data ?? []).filter((item) => matches(item.status, filter)),
    [data, filter],
  );

  if (loading && !data) return <LoadingBlock label="Cargando trámites" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <View style={styles.hero}>
        <Eyebrow light>Gestoría</Eyebrow>
        <AppText weight="800" color={colors.white} style={styles.title}>
          Trámites
        </AppText>
        <AppText color="rgba(255,255,255,0.72)">
          Lo que ZIA está moviendo ante cada autoridad.
        </AppText>
      </View>
      <View style={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => {
            const selected = item.id === filter;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, selected && styles.chipOn]}
              >
                <AppText weight="700" color={selected ? colors.ink : colors.muted}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        {rows.length === 0 ? (
          <AppText color={colors.muted} style={styles.empty}>
            No hay trámites en este filtro.
          </AppText>
        ) : (
          rows.map((item) => (
            <Link key={item.id} href={{ pathname: '/tramites/[id]', params: { id: item.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.authority, { backgroundColor: REGULATORS[item.authority].color }]}>
                    <AppText weight="800" color={colors.white} style={styles.authorityText}>
                      {REGULATORS[item.authority].abbr}
                    </AppText>
                  </View>
                  <AppText weight="700" color={colors.teal}>
                    {statusLabel(item.status)}
                  </AppText>
                </View>
                <AppText weight="800" style={styles.cardTitle}>
                  {item.title}
                </AppText>
                <AppText color={colors.muted}>
                  {item.stationName} · {item.reference}
                </AppText>
                <AppText color={colors.muted} style={styles.updated}>
                  Actualizado {formatDate(item.updatedAt)}
                </AppText>
              </Pressable>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
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
  body: { paddingHorizontal: 16, gap: 12, marginTop: 12 },
  filters: { gap: 8, paddingBottom: 2 },
  chip: {
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authority: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  authorityText: { fontSize: 11, letterSpacing: 0.4 },
  cardTitle: { fontSize: 17, lineHeight: 22 },
  updated: { fontSize: 12 },
  empty: { textAlign: 'center', padding: 24 },
});
