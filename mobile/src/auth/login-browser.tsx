import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, space } from '@/theme';

/** En el navegador el redirect registrado no vuelve a esta app. El APK sí completa el acceso. */
export function LoginBrowser(_props: {
  url: string;
  onCancel: () => void;
  onResult: (url: string) => void;
}) {
  return (
    <View style={styles.box}>
      <AppText weight="700">El acceso real está en la app de Android</AppText>
      <AppText color={colors.muted} style={styles.copy}>
        La consola solo devuelve el código de acceso a console.ziacentro.mx. La aplicación instalada lo
        recibe dentro de su navegador. Desde esta vista web no se puede cerrar ese ciclo.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: space.lg,
    gap: space.sm,
  },
  copy: { lineHeight: 20 },
});
