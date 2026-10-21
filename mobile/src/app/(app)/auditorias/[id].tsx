import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchAuditoria } from '@/api';
import { AppText, EmptyBlock, ErrorBlock, LoadingBlock, ScreenHeader, StatusPill } from '@/components/ui';
import { clasificacionEtiqueta, estadoEtiqueta, estadoNombre, formatWhen, severidadEtiqueta, tipoReporteEtiqueta } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { Hallazgo } from '@/types';

export default function AuditoriaDetalleScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const load = useCallback(() => (id ? fetchAuditoria(id) : Promise.resolve(null)), [id]);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (!id) return <ErrorBlock message="Falta el expediente." onRetry={refresh} />;
  if (loading && !data && !error) return <LoadingBlock label="Cargando el expediente" />;
  if (error && !data) return <ErrorBlock message={error} onRetry={refresh} />;
  if (!data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Auditoría" />
        <View style={styles.pad}>
          <EmptyBlock title="No encontrada" body="Ese expediente ya no está en la consola." />
        </View>
      </View>
    );
  }

  const estado = estadoNombre(data.estadoGeneral);
  const color = estado === 'Conforme' ? colors.asea : estado === 'Precaucion' ? colors.cne : colors.red;
  const generales = data.resultado?.hallazgosGenerales ?? [];
  const deProductos = (data.resultado?.productos ?? []).flatMap((product) =>
    product.hallazgos.map((item) => ({ ...item, producto: product.nombre || product.clave || 'Producto' })),
  );
  const hallazgos = [...generales.map((item) => ({ ...item, producto: 'General' })), ...deProductos].slice(0, 40);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <ScreenHeader title={data.periodo || 'Auditoría'} subtitle={data.numPermiso || data.nombreArchivo || undefined} />
      <View style={styles.pad}>
        <View style={styles.pills}>
          <StatusPill label={estadoEtiqueta(data.estadoGeneral)} color={color} />
          <StatusPill label={clasificacionEtiqueta(data.clasificacion)} color={colors.teal} />
          <StatusPill label={tipoReporteEtiqueta(data.tipoReporte)} color={colors.ink} />
        </View>
        {data.resultado?.estadoTexto ? <AppText style={styles.lead}>{data.resultado.estadoTexto}</AppText> : null}
        <AppText color={colors.muted}>
          {data.rfcContribuyente ? `RFC ${data.rfcContribuyente} · ` : ''}
          {data.organizacion ? `${data.organizacion} · ` : ''}
          {formatWhen(data.creationTime)}
        </AppText>
        <AppText color={colors.muted}>
          {data.productos} productos · {data.hallazgosAltos} hallazgos altos · {data.hallazgosMedios} medios
          {data.resultado ? ` · ${data.resultado.erroresDeSintaxis} errores de sintaxis` : ''}
        </AppText>
        {data.pendienteDeConfirmar ? (
          <AppText color={colors.cne}>Este archivo sigue pendiente de confirmar en la consola.</AppText>
        ) : null}

        <AppText weight="800" style={styles.section}>
          Hallazgos
        </AppText>
        {hallazgos.length === 0 ? (
          <EmptyBlock title="Sin hallazgos en el detalle" body="El resumen no trae observaciones para mostrar aquí." />
        ) : (
          hallazgos.map((item, index) => <HallazgoCard key={`${item.codigo ?? index}`} item={item} producto={item.producto} />)
        )}
      </View>
    </ScrollView>
  );
}

function HallazgoCard({ item, producto }: { item: Hallazgo; producto: string }) {
  const severidad = severidadEtiqueta(item.severidad);
  const color = severidad === 'Alta' ? colors.red : severidad === 'Media' ? colors.cne : colors.teal;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <AppText weight="700" style={styles.flex}>
          {item.titulo || item.codigo || 'Hallazgo'}
        </AppText>
        <StatusPill label={severidad} color={color} />
      </View>
      <AppText color={colors.muted}>{producto}</AppText>
      {item.observacion ? <AppText style={styles.body}>{item.observacion}</AppText> : null}
      {item.accion ? (
        <AppText color={colors.muted} style={styles.body}>
          {item.accion}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 32 },
  pad: { paddingHorizontal: space.lg, gap: space.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lead: { lineHeight: 21 },
  section: { fontSize: 18, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  body: { lineHeight: 20 },
});
