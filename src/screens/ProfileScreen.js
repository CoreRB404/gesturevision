import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Switch, TouchableOpacity,
  Platform, PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadows } from '../styles/theme';
import { checkAccessibility, openAccessibilitySettings, canDrawOverlays, requestOverlayPermission, startOverlay, stopOverlay, isOverlayRunning } from '../services/gestureDetector';

async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    } catch (e) {
      console.log('Notification permission error:', e);
    }
  }
}

function OverlayCard() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const check = async () => {
      setRunning(await isOverlayRunning());
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    if (running) {
      await stopOverlay();
      setRunning(false);
    } else {
      // Check overlay permission first
      const hasOverlay = await canDrawOverlays();
      if (!hasOverlay) {
        await requestOverlayPermission();
        return; // User needs to grant, then come back and tap again
      }
      await requestNotificationPermission();
      await startOverlay();
      setRunning(true);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.accessibilityCard, { borderColor: running ? '#00cec9' + '50' : colors.border }]}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.accessibilityIcon, { backgroundColor: running ? 'rgba(0,206,201,0.15)' : 'rgba(108,92,231,0.15)' }]}>
        <Ionicons name={running ? 'eye' : 'eye-off-outline'} size={24} color={running ? '#00cec9' : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.accessibilityTitle}>
          {running ? '🟢 Background Active' : 'Enable Background Mode'}
        </Text>
        <Text style={styles.accessibilityDesc}>
          {running
            ? 'Floating icon active — gestures work in any app'
            : 'Tap to start floating gesture detection overlay'
          }
        </Text>
      </View>
      <Ionicons name={running ? 'stop-circle-outline' : 'play-circle-outline'} size={24} color={running ? colors.error : colors.success} />
    </TouchableOpacity>
  );
}


function AccessibilityCard() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isEnabled = await checkAccessibility();
      setEnabled(isEnabled);
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = async () => {
    // Request notification permission first (Android 13+)
    await requestNotificationPermission();
    // Then open accessibility settings
    await openAccessibilitySettings();
  };

  return (
    <TouchableOpacity
      style={[styles.accessibilityCard, { borderColor: enabled ? colors.success + '50' : colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.accessibilityIcon, { backgroundColor: enabled ? 'rgba(85,239,196,0.15)' : 'rgba(108,92,231,0.15)' }]}>
        <Ionicons name={enabled ? 'shield-checkmark' : 'shield-outline'} size={24} color={enabled ? colors.success : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.accessibilityTitle}>
          {enabled ? '✅ Service Active' : 'Enable Accessibility'}
        </Text>
        <Text style={styles.accessibilityDesc}>
          {enabled
            ? 'Gestures will control your Android screen + notifications'
            : 'Tap to enable → Settings → Accessibility → GestureVision'
          }
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const STATS_DATA = [
  { label: 'Gestures Today', value: '127', icon: 'hand-left-outline', color: colors.primary },
  { label: 'Accuracy', value: '94%', icon: 'analytics-outline', color: colors.success },
  { label: 'Screen Time', value: '2h 15m', icon: 'time-outline', color: colors.secondary },
];

const SETTINGS = [
  { id: 'haptic', label: 'Haptic Feedback', desc: 'Vibrate on gesture detection', icon: 'phone-portrait-outline', default: true },
  { id: 'sound', label: 'Sound Effects', desc: 'Play sound on gesture', icon: 'volume-medium-outline', default: false },
  { id: 'sensitivity', label: 'High Sensitivity', desc: 'Detect subtle gestures', icon: 'speedometer-outline', default: true },
  { id: 'autoswipe', label: 'Auto Navigation', desc: 'Navigate on swipe gesture', icon: 'navigate-outline', default: true },
  { id: 'showfeed', label: 'Show Camera Feed', desc: 'Display camera overlay', icon: 'eye-outline', default: true },
];

function SettingRow({ setting, index }) {
  const [enabled, setEnabled] = useState(setting.default);
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.settingRow,
        { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: enabled ? 'rgba(108,92,231,0.15)' : colors.bgCard }]}>
        <Ionicons name={setting.icon} size={20} color={enabled ? colors.primary : colors.textMuted} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{setting.label}</Text>
        <Text style={styles.settingDesc}>{setting.desc}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
        thumbColor={enabled ? colors.primary : colors.textMuted}
      />
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient
        colors={[colors.bg, '#0d0d1a', colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          style={[
            styles.profileCard,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          <LinearGradient
            colors={['rgba(108,92,231,0.25)', 'rgba(0,206,201,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.avatar}
            >
              <Ionicons name="code-slash" size={40} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.profileName}>Developer</Text>
          <Text style={styles.profileEmail}>corerb.netlify.app</Text>


          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Ionicons name="terminal" size={14} color={colors.warningDark} />
            <Text style={styles.levelText}>Build Native</Text>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { paddingHorizontal: spacing.md }]}>
          {STATS_DATA.map((stat, i) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Gesture Settings</Text>
        {SETTINGS.map((setting, index) => (
          <SettingRow key={setting.id} setting={setting} index={index} />
        ))}

        {/* Accessibility Service */}
        <Text style={styles.sectionTitle}>Android Swipe Control</Text>
        <AccessibilityCard />

        {/* Background Mode */}
        <Text style={styles.sectionTitle}>Background Mode</Text>
        <OverlayCard />

        {/* About Card */}
        <View style={styles.aboutCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutTitle}>GestureVision v1.0.0</Text>
            <Text style={styles.aboutDesc}>
              Powered by MediaPipe Hands AI
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(253, 203, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253, 203, 110, 0.3)',
    gap: spacing.xs,
  },
  levelText: {
    fontSize: fontSize.sm,
    color: colors.warningDark,
    fontWeight: fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    gap: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  settingDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  aboutTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  aboutDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  accessibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  accessibilityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessibilityTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  accessibilityDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
