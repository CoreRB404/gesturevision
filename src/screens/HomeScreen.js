import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadows, glass } from '../styles/theme';

const { width } = Dimensions.get('window');

const GESTURES = [
  { emoji: '🤙', name: 'Pinky', action: 'Swipe Left', color: colors.primary },
  { emoji: '👍', name: 'Thumb', action: 'Swipe Right', color: colors.primaryLight },
  { emoji: '✌️', name: 'Peace', action: 'Swipe Up', color: colors.secondary },
  { emoji: '☝️', name: 'Point', action: 'Swipe Down', color: colors.accent },
];

function GestureCard({ item, index }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.gestureCard,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          borderLeftColor: item.color,
        },
      ]}
    >
      <Text style={styles.gestureEmoji}>{item.emoji}</Text>
      <View style={styles.gestureInfo}>
        <Text style={styles.gestureName}>{item.name}</Text>
        <Text style={styles.gestureAction}>{item.action}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const heroScale = useRef(new Animated.Value(0.5)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient
        colors={[colors.bg, '#0f0f1e', colors.bg]}
        style={StyleSheet.absoluteFill}
      />

     <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branded Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
             <Ionicons name="eye" size={24} color={colors.primary} />
             <View style={styles.logoGlow} />
          </View>
          <Text style={styles.brandTitle}>
            Gesture<Text style={{ color: colors.primary }}>Vision</Text>
          </Text>
        </View>

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              transform: [{ scale: heroScale }],
              opacity: heroOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.heroGlow,
              { opacity: glowAnim },
            ]}
          />
          <Text style={styles.heroEmoji}>✋</Text>
          <Text style={styles.heroTitle}>GestureVision</Text>
          <Text style={styles.heroSubtitle}>
            Control your app with hand gestures
          </Text>
        </Animated.View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['rgba(108,92,231,0.15)', 'rgba(0,206,201,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.statusDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Camera Active</Text>
            <Text style={styles.statusDesc}>
              Point your hand at the camera in the bottom-right corner
            </Text>
          </View>
        </View>

        {/* Gesture Guide */}
        <Text style={styles.sectionTitle}>Gesture Guide</Text>
        <Text style={styles.sectionSubtitle}>
          Learn the gestures to navigate
        </Text>

        {GESTURES.map((item, index) => (
          <GestureCard key={item.name} item={item} index={index} />
        ))}

        {/* Tips */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={colors.warningDark} />
          <Text style={styles.tipText}>
            Hold your hand about 30cm from the camera for best detection.
            Make sure your hand is well-lit!
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: 4,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(108,92,231,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.2)',
    overflow: 'hidden',
  },
  logoGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    top: -40,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statusDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  gestureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderLeftWidth: 3,
    gap: spacing.md,
  },
  gestureEmoji: {
    fontSize: 28,
  },
  gestureInfo: {
    flex: 1,
  },
  gestureName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  gestureAction: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(253, 203, 110, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(253, 203, 110, 0.2)',
    gap: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
