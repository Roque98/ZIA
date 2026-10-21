import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchAuditorias } from '@/api';
import { AppText, DeniedBlock, EmptyBlock, ErrorBlock, LoadingBlock, StatusPill } from '@/components/ui';
import { clasificacionEtiqueta, estadoEtiqueta, estadoNombre, formatWhen, tipoReporteEtiqueta } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { Auditoria } from '@/types';

export default function AuditoriasScreen() {
  const load = useCallback(() => fetchAuditorias(), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando auditorías" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;
  if (data.access === 'denied') {
    return (
      <DeniedBlock
        title="Sin acceso a auditorías"
        body="Tu cuenta no tiene permiso para ver los expedientes volumétricos. Si deberías verlos, pide el acceso en la consola."
      />
    );
  }

  const historial = data.data;
  const conteos = historial.conteos;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <AppText weight="800" style={styles.title}>
        Auditorías
      </AppText>
      <AppText color={colors.muted} style={styles.lead}>
        Expedientes de control volumétrico cargados en la consola.
      </AppText>
      {conteos ? (
        <View style={styles.stats}>
          <Stat label="Total" value={String(conteos.todos)} />
          <Stat label="Errores" value={String(conteos.conErrores)} />
          <Stat label="Observaciones" value={String(conteos.conObservaciones)} />
        </View>
      ) : null}
      {historial.items.length === 0 ? (
        <EmptyBlock title="Sin auditorías" body="Todavía no hay archivos volumétricos en tu historial." />
      ) : (
        historial.items.map((item) => <AuditCard key={item.id} item={item} />)
      )}
      {historial.totalCount > historial.items.length ? (
        <AppText color={colors.muted}>
          Mostrando {historial.items.length} de {historial.totalCount}. El resto está en la consola web.
        </AppText>
      ) : null}
    </ScrollView>
  );
}

function AuditCard({ item }: { item: Auditoria }) {
  const estado = estadoNombre(item.estadoGeneral);
  const color = estado === 'Conforme' ? colors.asea : estado === 'Precaucion' ? colors.cne : colors.red;
  return (
    <Link href={{ pathname: '/auditorias/[id]', params: { id: item.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.row}>
          <AppText weight="800" style={styles.name} numberOfLines={2}>
            {item.periodo || item.nombreArchivo || 'Auditoría'}
          </AppText>
          <StatusPill label={estadoEtiqueta(item.estadoGeneral)} color={color} />
        </View>
        <AppText color={colors.muted}>
          {item.numPermiso || 'Sin permiso'} · {tipoReporteEtiqueta(item.tipoReporte)}
        </AppText>
        <AppText color={colors.muted}>
          {clasificacionEtiqueta(item.clasificacion)} · {item.hallazgosAltos} altos · {item.hallazgosMedios} medios
        </AppText>
        <AppText color={colors.muted} style={styles.meta}>
          {item.organizacion ? `${item.organizacion} · ` : ''}
          {formatWhen(item.creationTime)}
          {item.pendienteDeConfirmar ? ' · pendiente de confirmar' : ''}
        </AppText>
      </Pressable>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText weight="800" style={styles.statValue}>
        {value}
      </AppText>
      <AppText color={colors.muted} style={styles.statLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.md, paddingBottom: 32 },
  title: { fontSize: 28 },
  lead: { lineHeight: 20, marginTop: -6 },
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
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 17 },
  meta: { fontSize: 12 },
});
