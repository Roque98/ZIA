import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchDeadlines } from '@/api';
import { CalendarIcon, FolderIcon, HomeIcon, StationIcon } from '@/components/icons';
import { AppText, BootScreen } from '@/components/ui';
import { daysUntil } from '@/format';
import { useSession } from '@/session';
import { colors } from '@/theme';

export default function AppLayout() {
  const { session, isLoading, signOut } = useSession();
  const [overdue, setOverdue] = useState(0);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchDeadlines(session.token)
      .then((rows) => {
        if (active) setOverdue(rows.filter((row) => daysUntil(row.due) < 0).length);
      })
      .catch(() => {
        if (active) setOverdue(0);
      });
    return () => {
      active = false;
    };
  }, [session]);

  if (isLoading) return <BootScreen />;
  if (!session) return <Redirect href="/login" />;

  const mock = session.source === 'mock';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.bar, mock ? styles.barMock : styles.barLive]}>
        <AppText
          weight="700"
          color={mock ? colors.ink : colors.white}
          numberOfLines={1}
          style={styles.barText}
        >
          {mock ? 'Demostración · sin servidor de acceso' : session.user.company}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => {
            void signOut();
          }}
          hitSlop={8}
        >
          <AppText weight="800" color={mock ? colors.ink : colors.gold} style={styles.barAction}>
            Salir
          </AppText>
        </Pressable>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.48)',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: { backgroundColor: colors.paper },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <HomeIcon color={tint(color)} size={size} />,
          }}
        />
        <Tabs.Screen
          name="estaciones"
          options={{
            title: 'Estaciones',
            tabBarIcon: ({ color, size }) => <StationIcon color={tint(color)} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tramites"
          options={{
            title: 'Trámites',
            tabBarIcon: ({ color, size }) => <FolderIcon color={tint(color)} size={size} />,
          }}
        />
        <Tabs.Screen
          name="vencimientos"
          options={{
            title: 'Agenda',
            tabBarBadge: overdue > 0 ? overdue : undefined,
            tabBarBadgeStyle: styles.badge,
            tabBarIcon: ({ color, size }) => <CalendarIcon color={tint(color)} size={size} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

function tint(color: unknown): string {
  return typeof color === 'string' ? color : colors.teal;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barMock: { backgroundColor: colors.gold },
  barLive: { backgroundColor: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.inkRaised },
  barText: { flex: 1, fontSize: 12 },
  barAction: { fontSize: 13 },
  tabBar: {
    backgroundColor: colors.ink,
    borderTopColor: '#1b3336',
    borderTopWidth: 1,
  },
  tabLabel: {
    fontFamily: 'MonaSans',
    fontWeight: '600',
    fontSize: 11,
  },
  badge: {
    backgroundColor: colors.red,
    color: colors.white,
    fontFamily: 'MonaSans',
    fontSize: 11,
  },
});
