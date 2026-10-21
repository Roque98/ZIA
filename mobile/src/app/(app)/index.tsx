import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchInicio } from '@/api';
import { AppText, Card, EmptyBlock, ErrorBlock, Eyebrow, LoadingBlock, StatusPill } from '@/components/ui';
import { ZiaMark } from '@/components/zia-mark';
import { alarmaAbierta, firstName, formatWhen, greeting, liters, money } from '@/format';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/session';
import { colors, space } from '@/theme';
import type { Aviso, EstacionVista } from '@/types';

export default function HomeScreen() {
  const { session } = useSession();
  const load = useCallback(() => fetchInicio(), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando la consola" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;

  const connected = data.estaciones.filter((item) => item.operacion?.nodo?.conectado).length;
  const alarms = data.estaciones.reduce(
    (sum, item) => sum + (item.operacion?.alarmas.filter((alarm) => alarmaAbierta(alarm.finUtc, alarm.reconocida)).length ?? 0),
    0,
  );
  const litrosHoy = data.estaciones.reduce((sum, item) => sum + (item.operacion?.ventas?.litros ?? 0), 0);
  const importeHoy = data.estaciones.reduce((sum, item) => sum + (item.operacion?.ventas?.importe ?? 0), 0);
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
          {firstName(user?.name ?? '')}
        </AppText>
        <AppText color="rgba(255,255,255,0.72)" style={styles.role}>
          {session?.organization ?? user?.email}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.stats}>
          <Stat label="Estaciones" value={String(data.estaciones.length)} />
          <Stat label="En línea" value={String(connected)} />
          <Stat label="Alarmas" value={String(alarms)} tone={alarms > 0 ? colors.red : colors.asea} />
        </View>
        <Card>
          <Eyebrow>Ventas de hoy</Eyebrow>
          <AppText weight="800" style={styles.sales}>
            {liters(litrosHoy)}
          </AppText>
          <AppText color={colors.muted}>{money(importeHoy)} en las estaciones visibles</AppText>
        </Card>

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
        {data.estaciones.length === 0 ? (
          <EmptyBlock
            title="Sin estaciones"
            body="Tu cuenta no tiene estaciones asignadas en la consola."
          />
        ) : (
          <View style={styles.stack}>
            {data.estaciones.slice(0, 4).map((station) => (
              <StationRow key={`${station.orgId}:${station.numPermiso}`} station={station} />
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <AppText weight="800" style={styles.sectionTitle}>
            Avisos
          </AppText>
        </View>
        {data.avisos.length === 0 ? (
          <EmptyBlock title="Sin avisos" body="No hay notificaciones recientes en tu cuenta." />
        ) : (
          <View style={styles.stack}>
            {data.avisos.slice(0, 4).map((item) => (
              <AvisoRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, tone = colors.ink }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <AppText weight="800" color={tone} style={styles.statValue}>
        {value}
      </AppText>
      <AppText color={colors.muted} style={styles.statLabel}>
        {label}
      </AppText>
    </View>
  );
}

function StationRow({ station }: { station: EstacionVista }) {
  const online = station.operacion?.nodo?.conectado === true;
  const open = station.operacion?.alarmas.filter((alarm) => alarmaAbierta(alarm.finUtc, alarm.reconocida)).length ?? 0;
  return (
    <Link
      href={{ pathname: '/estaciones/detalle', params: { permiso: station.numPermiso, org: station.orgId, nombre: station.nombre } }}
      asChild
    >
      <Pressable style={styles.row}>
        <View style={styles.rowTop}>
          <AppText weight="700" style={styles.rowTitle} numberOfLines={1}>
            {station.nombre}
          </AppText>
          <StatusPill label={online ? 'En línea' : 'Sin enlace'} color={online ? colors.asea : colors.muted} />
        </View>
        <AppText color={colors.muted} numberOfLines={1}>
          {station.numPermiso}
          {open > 0 ? ` · ${open} alarma${open === 1 ? '' : 's'}` : ''}
          {station.operacion?.ventas ? ` · ${liters(station.operacion.ventas.litros)}` : ''}
        </AppText>
      </Pressable>
    </Link>
  );
}

function AvisoRow({ item }: { item: Aviso }) {
  return (
    <View style={styles.row}>
      <AppText weight="700" numberOfLines={2}>
        {item.title ?? 'Aviso'}
      </AppText>
      {item.body ? (
        <AppText color={colors.muted} numberOfLines={3}>
          {item.body}
        </AppText>
      ) : null}
      <AppText color={colors.muted} style={styles.when}>
        {formatWhen(item.creationTime)}
        {item.isRead ? '' : ' · sin leer'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 28 },
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: 36,
    gap: 4,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  brand: { fontSize: 16, letterSpacing: 1 },
  name: { fontSize: 32, lineHeight: 36 },
  role: { fontSize: 14 },
  body: { marginTop: -18, paddingHorizontal: space.lg, gap: space.lg },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    gap: 2,
  },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  sales: { fontSize: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18 },
  stack: { gap: space.sm },
  row: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 16 },
  when: { fontSize: 12 },
});
