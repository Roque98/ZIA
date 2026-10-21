import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchEstacion, reconocerAlarma } from '@/api';
import { AppText, Card, EmptyBlock, ErrorBlock, LoadingBlock, Meter, ScreenHeader, StatusPill } from '@/components/ui';
import { alarmaAbierta, asNumber, formatWhen, liters, money } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { AlarmaEnOperacion } from '@/types';

export default function EstacionDetalleScreen() {
  const params = useLocalSearchParams<{ permiso?: string; org?: string; nombre?: string }>();
  const permiso = first(params.permiso);
  const org = first(params.org);
  const nombre = first(params.nombre);
  const load = useCallback(() => {
    if (!permiso || !org) return Promise.resolve(null);
    return fetchEstacion(org, permiso);
  }, [org, permiso]);
  const { data, error, loading, refreshing, refresh } = useApi(load);
  const [acking, setAcking] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);

  if (!permiso || !org) return <ErrorBlock message="Falta la estación." onRetry={refresh} />;
  if (loading && data === null && !error) return <LoadingBlock label="Cargando la estación" />;
  if (error && !data) return <ErrorBlock message={error} onRetry={refresh} />;
  if (!data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={nombre || permiso} subtitle={permiso} />
        <View style={styles.pad}>
          <EmptyBlock title="Sin operación" body="La consola no devolvió el estado de esta estación." />
        </View>
      </View>
    );
  }

  const open = data.alarmas.filter((alarm) => alarmaAbierta(alarm.finUtc, alarm.reconocida));
  const online = data.nodo?.conectado === true;

  async function ack(alarm: AlarmaEnOperacion) {
    setAcking(alarm.id);
    setAckError(null);
    try {
      await reconocerAlarma(alarm.id);
      refresh();
    } catch (err) {
      setAckError(err instanceof Error ? err.message : 'No se pudo reconocer la alarma.');
    } finally {
      setAcking(null);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <ScreenHeader title={data.nombre || nombre || 'Estación'} subtitle={data.numPermiso} />
      <View style={styles.pad}>
        <View style={styles.pills}>
          <StatusPill label={online ? 'Nodo en línea' : 'Nodo sin enlace'} color={online ? colors.asea : colors.muted} />
          {data.nodo?.version ? <StatusPill label={data.nodo.version} color={colors.teal} /> : null}
        </View>
        <AppText color={colors.muted}>
          {data.nodo?.ultimoLatido ? `Último latido ${formatWhen(data.nodo.ultimoLatido)}` : 'Sin latido registrado'}
          {data.dia ? ` · día operativo ${data.dia}` : ''}
        </AppText>

        <Card>
          <AppText weight="700">Ventas del día</AppText>
          <AppText weight="800" style={styles.big}>
            {data.ventas ? liters(data.ventas.litros) : '—'}
          </AppText>
          <AppText color={colors.muted}>
            {data.ventas ? `${money(data.ventas.importe)} · ${data.ventas.despachos} despachos` : 'Sin ventas reportadas'}
          </AppText>
        </Card>

        <Section title="Tanques">
          {data.tanques.length === 0 ? <Muted>No hay lecturas de tanque.</Muted> : null}
          {data.tanques.map((tank) => {
            const capacity = asNumber(tank.capacidad);
            const volume = asNumber(tank.volumen);
            const pct = capacity > 0 ? Math.round((volume / capacity) * 100) : 0;
            return (
              <View key={tank.numero} style={styles.block}>
                <View style={styles.row}>
                  <AppText weight="700">Tanque {tank.numero}</AppText>
                  <AppText color={colors.muted}>{tank.producto ?? 'Producto'}</AppText>
                </View>
                <Meter value={pct} color={pct < 15 ? colors.cne : colors.teal} />
                <AppText color={colors.muted}>
                  {tank.volumen == null ? 'Sin volumen' : `${liters(tank.volumen)} de ${liters(tank.capacidad)}`}
                  {tank.temperatura == null ? '' : ` · ${tank.temperatura} °C`}
                  {tank.agua == null ? '' : ` · agua ${tank.agua} mm`}
                </AppText>
              </View>
            );
          })}
        </Section>

        <Section title="Dispensarios">
          {data.dispensarios.length === 0 ? <Muted>No hay dispensarios en la operación.</Muted> : null}
          {data.dispensarios.map((pump) => (
            <View key={pump.numero} style={styles.block}>
              <View style={styles.row}>
                <AppText weight="700">Dispensario {pump.numero}</AppText>
                <AppText color={colors.muted}>{pump.estado ?? pump.producto ?? ''}</AppText>
              </View>
              <AppText color={colors.muted}>
                {liters(pump.litros)} · {money(pump.importe)}
                {pump.ultimoDespachoUtc ? ` · ${formatWhen(pump.ultimoDespachoUtc)}` : ''}
              </AppText>
            </View>
          ))}
        </Section>

        <Section title="Alarmas">
          {ackError ? <AppText color={colors.red}>{ackError}</AppText> : null}
          {open.length === 0 ? <Muted>No hay alarmas abiertas.</Muted> : null}
          {open.map((alarm) => (
            <View key={alarm.id} style={styles.block}>
              <AppText weight="700">{alarm.texto || alarm.tipo || 'Alarma'}</AppText>
              <AppText color={colors.muted}>
                {alarm.nivel ? `${alarm.nivel} · ` : ''}
                {formatWhen(alarm.inicioUtc)}
              </AppText>
              <Pressable
                accessibilityRole="button"
                disabled={acking === alarm.id}
                onPress={() => {
                  void ack(alarm);
                }}
                style={styles.ack}
              >
                <AppText weight="700" color={colors.teal}>
                  {acking === alarm.id ? 'Reconociendo…' : 'Reconocer'}
                </AppText>
              </Pressable>
            </View>
          ))}
        </Section>

        <Section title="Balance">
          {data.balance.length === 0 ? <Muted>Sin balance del día.</Muted> : null}
          {data.balance.map((line, index) => (
            <View key={`${line.producto ?? 'p'}-${index}`} style={styles.block}>
              <View style={styles.row}>
                <AppText weight="700">{line.producto ?? 'Producto'}</AppText>
                <StatusPill
                  label={line.enTolerancia === false ? 'Fuera de tolerancia' : line.calculable ? 'En tolerancia' : 'No calculable'}
                  color={line.enTolerancia === false ? colors.red : colors.asea}
                />
              </View>
              <AppText color={colors.muted}>
                Diferencia {liters(line.diferenciaLitros)}
                {line.diferenciaPorcentaje == null ? '' : ` (${line.diferenciaPorcentaje.toFixed(2)}%)`}
              </AppText>
            </View>
          ))}
        </Section>

        <Section title="Últimos despachos">
          {data.ultimosDespachos.length === 0 ? <Muted>Sin despachos recientes.</Muted> : null}
          {data.ultimosDespachos.slice(0, 8).map((sale, index) => (
            <View key={`${sale.folio ?? index}`} style={styles.block}>
              <AppText weight="700">
                {sale.producto ?? 'Producto'} · {liters(sale.litros)}
              </AppText>
              <AppText color={colors.muted}>
                Disp. {sale.dispensario} manguera {sale.manguera} · {money(sale.importe)} · {formatWhen(sale.finUtc)}
              </AppText>
            </View>
          ))}
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText weight="800" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Muted({ children }: { children: string }) {
  return <AppText color={colors.muted}>{children}</AppText>;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 32 },
  pad: { paddingHorizontal: space.lg, gap: space.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  big: { fontSize: 28 },
  section: { gap: space.sm },
  sectionTitle: { fontSize: 18 },
  block: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ack: { alignSelf: 'flex-start', paddingVertical: 4 },
});
