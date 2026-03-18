import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../styles/theme';

import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: 'home', inactive: 'home-outline' },
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function AppNavigator({ navigationRef }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={22}
                color={color}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 10, 15, 0.98)',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 4,
          elevation: 0,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
  },
  tabIconActive: {},
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
