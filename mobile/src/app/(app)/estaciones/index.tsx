import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchInicio } from '@/api';
import { AppText, EmptyBlock, ErrorBlock, LoadingBlock, StatusPill } from '@/components/ui';
import { alarmaAbierta, formatWhen, liters, money } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { EstacionVista } from '@/types';

export default function EstacionesScreen() {
  const load = useCallback(() => fetchInicio(), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando estaciones" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  const groups = new Map<string, { nombre: string; demo: boolean; estaciones: EstacionVista[] }>();
  for (const station of data.estaciones) {
    const current = groups.get(station.orgId) ?? { nombre: station.orgNombre, demo: station.esDemostracion, estaciones: [] };
    current.estaciones.push(station);
    groups.set(station.orgId, current);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <AppText weight="800" style={styles.title}>
        Estaciones
      </AppText>
      <AppText color={colors.muted} style={styles.lead}>
        Operación en vivo: enlace del nodo, ventas del día, tanques y alarmas.
      </AppText>
      {data.estaciones.length === 0 ? (
        <EmptyBlock title="Sin estaciones" body="Tu cuenta no tiene estaciones asignadas en la consola." />
      ) : null}
      {[...groups.values()].map((group) => (
        <View key={group.nombre} style={styles.group}>
          <View style={styles.groupHead}>
            <AppText weight="700" color={colors.muted}>
              {group.nombre}
            </AppText>
            {group.demo ? <StatusPill label="Demostración" color={colors.gold} /> : null}
          </View>
          {group.estaciones.map((station) => (
            <StationCard key={station.numPermiso} station={station} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function StationCard({ station }: { station: EstacionVista }) {
  const online = station.operacion?.nodo?.conectado === true;
  const open = station.operacion?.alarmas.filter((alarm) => alarmaAbierta(alarm.finUtc, alarm.reconocida)).length ?? 0;
  const ventas = station.operacion?.ventas;
  return (
    <Link
      href={{ pathname: '/estaciones/detalle', params: { permiso: station.numPermiso, org: station.orgId, nombre: station.nombre } }}
      asChild
    >
      <Pressable style={styles.card}>
        <View style={styles.row}>
          <AppText weight="800" style={styles.name} numberOfLines={2}>
            {station.nombre}
          </AppText>
          <StatusPill label={online ? 'En línea' : 'Sin enlace'} color={online ? colors.asea : colors.muted} />
        </View>
        <AppText color={colors.muted}>{station.numPermiso}</AppText>
        <View style={styles.metrics}>
          <Metric label="Litros hoy" value={ventas ? liters(ventas.litros) : '—'} />
          <Metric label="Importe" value={ventas ? money(ventas.importe) : '—'} />
          <Metric label="Alarmas" value={String(open)} />
        </View>
        <AppText color={colors.muted} style={styles.beat}>
          {station.operacion?.nodo?.ultimoLatido
            ? `Último latido ${formatWhen(station.operacion.nodo.ultimoLatido)}`
            : 'Sin latido del nodo'}
        </AppText>
      </Pressable>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText weight="700">{value}</AppText>
      <AppText color={colors.muted} style={styles.metricLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 32 },
  title: { fontSize: 28 },
  lead: { lineHeight: 20, marginTop: -8 },
  group: { gap: space.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 18 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, gap: 2 },
  metricLabel: { fontSize: 12 },
  beat: { fontSize: 12 },
});
