import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { fetchStations } from '@/api';
import { AppText, ErrorBlock, Eyebrow, LevelPill, LoadingBlock, Meter, levelColor } from '@/components/ui';
import { levelFor } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';

export default function EstacionesScreen() {
  const load = useCallback((token: string) => fetchStations(token), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);
  const [query, setQuery] = useState('');

  const stations = useMemo(() => {
    const rows = data ?? [];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((station) =>
          `${station.name} ${station.city} ${station.state} ${station.permit}`.toLowerCase().includes(needle),
        )
      : rows;
    return filtered.slice().sort((a, b) => a.score - b.score);
  }, [data, query]);

  if (loading && !data) return <LoadingBlock label="Cargando estaciones" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <View style={styles.hero}>
        <Eyebrow light>Su cuenta</Eyebrow>
        <AppText weight="800" color={colors.white} style={styles.title}>
          Estaciones
        </AppText>
        <AppText color="rgba(255,255,255,0.72)">
          {data.length} gasolineras · el cumplimiento se lee por estación
        </AppText>
      </View>
      <View style={styles.body}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, ciudad o permiso"
          placeholderTextColor={colors.muted}
          style={styles.search}
          accessibilityLabel="Buscar estaciones"
          autoCorrect={false}
        />
        {stations.length === 0 ? (
          <AppText color={colors.muted} style={styles.empty}>
            Ninguna estación coincide con la búsqueda.
          </AppText>
        ) : (
          stations.map((station) => (
            <Link key={station.id} href={{ pathname: '/estaciones/[id]', params: { id: station.id } }} asChild>
              <Pressable accessibilityRole="button" style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <AppText weight="800" style={styles.name}>
                      {station.name}
                    </AppText>
                    <AppText color={colors.muted}>
                      {station.city}, {station.state}
                    </AppText>
                    <AppText color={colors.muted} style={styles.permit}>
                      {station.permit}
                    </AppText>
                  </View>
                  <AppText weight="800" style={[styles.score, { color: levelColor(levelFor(station.score)) }]}>
                    {station.score}
                  </AppText>
                </View>
                <Meter score={station.score} />
                <LevelPill level={levelFor(station.score)} />
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
  body: { paddingHorizontal: 16, gap: 12, marginTop: -12 },
  search: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'MonaSans',
    fontSize: 15,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardCopy: { flex: 1, gap: 2 },
  name: { fontSize: 18 },
  permit: { fontSize: 12, marginTop: 2 },
  score: { fontSize: 28 },
  empty: { textAlign: 'center', padding: 24 },
});
