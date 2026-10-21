import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { fetchLicencias } from '@/api';
import { AppText, DeniedBlock, EmptyBlock, ErrorBlock, LoadingBlock, StatusPill } from '@/components/ui';
import { formatWhen, licenciaEtiqueta, licenciaNombre, licenciaPorVencer, vigenciaEtiqueta } from '@/format';
import { useApi } from '@/hooks/use-api';
import { colors, space } from '@/theme';
import type { Licencia } from '@/types';

export default function LicenciasScreen() {
  const load = useCallback(() => fetchLicencias(), []);
  const { data, error, loading, refreshing, refresh } = useApi(load);

  if (loading && !data) return <LoadingBlock label="Cargando licencias" />;
  if (!data) return <ErrorBlock message={error ?? 'Sin datos.'} onRetry={refresh} />;
  if (data.access === 'denied') {
    return (
      <DeniedBlock
        title="Sin acceso a licencias"
        body="Tu cuenta no administra nodos. Las vigencias de licencia se consultan en la consola si tu rol lo permite."
      />
    );
  }

  const licencias = data.data.licencias
    .slice()
    .sort((a, b) => Number(licenciaPorVencer(b.estado, b.vigenteHasta)) - Number(licenciaPorVencer(a.estado, a.vigenteHasta)));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.teal} colors={[colors.teal]} />}
    >
      <AppText weight="800" style={styles.title}>
        Licencias
      </AppText>
      <AppText color={colors.muted} style={styles.lead}>
        Vigencia y enlace de los nodos de estación.
        {data.data.versionEstable ? ` Versión estable ${data.data.versionEstable}.` : ''}
      </AppText>
      {licencias.length === 0 ? (
        <EmptyBlock title="Sin licencias" body="No hay licencias de nodo asociadas a tu cuenta." />
      ) : (
        licencias.map((item) => <LicenseCard key={item.id} item={item} />)
      )}
    </ScrollView>
  );
}

function LicenseCard({ item }: { item: Licencia }) {
  const name = licenciaNombre(item.estado);
  const attention = licenciaPorVencer(item.estado, item.vigenteHasta);
  const color =
    name === 'Activa' && !attention ? colors.asea : name === 'PorActivar' || name === 'SinClave' ? colors.cne : colors.red;
  const online = item.nodo?.conectado === true;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <AppText weight="800" style={styles.name} numberOfLines={2}>
          {item.estacion || item.numPermiso || 'Licencia'}
        </AppText>
        <StatusPill label={licenciaEtiqueta(item.estado)} color={color} />
      </View>
      <AppText color={colors.muted}>{item.numPermiso}</AppText>
      {item.organizacion ? <AppText color={colors.muted}>{item.organizacion}</AppText> : null}
      <AppText weight="600">{vigenciaEtiqueta(item.vigenteHasta)}</AppText>
      <View style={styles.pills}>
        <StatusPill label={online ? 'Nodo en línea' : 'Nodo sin enlace'} color={online ? colors.asea : colors.muted} />
        {item.nodo?.version ? <StatusPill label={item.nodo.version} color={colors.teal} /> : null}
      </View>
      <AppText color={colors.muted} style={styles.meta}>
        {item.nodo?.ultimoLatido ? `Latido ${formatWhen(item.nodo.ultimoLatido)}` : 'Sin latido'}
        {item.activadaEn ? ` · activada ${formatWhen(item.activadaEn)}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.md, paddingBottom: 32 },
  title: { fontSize: 28 },
  lead: { lineHeight: 20, marginTop: -6 },
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
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: { fontSize: 12 },
});
