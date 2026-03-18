import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../styles/theme';

const GESTURE_ICONS = {
  open_palm: { emoji: '🖐️', color: colors.secondary },
  fist: { emoji: '✊', color: colors.accent },
  peace: { emoji: '✌️', color: colors.primaryLight },
  thumbs_up: { emoji: '👍', color: colors.success },
  pointing: { emoji: '👆', color: colors.warningDark },
  motion: { emoji: '👋', color: colors.secondary },
  swipe_left: { emoji: '👈', color: colors.primary },
  swipe_right: { emoji: '👉', color: colors.primary },
  swipe_up: { emoji: '👆', color: colors.primary },
  swipe_down: { emoji: '👇', color: colors.primary },
};

export default function GestureIndicator({ gesture, swipe, visible }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && (gesture || swipe)) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 1.5s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gesture, swipe, visible]);

  // Show swipe indicator
  useEffect(() => {
    if (swipe) {
      const direction = swipe.direction === 'left' ? -1 : swipe.direction === 'right' ? 1 : 0;
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: direction * 30,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [swipe]);

  if (!visible) return null;

  const displayGesture = swipe
    ? GESTURE_ICONS[`swipe_${swipe.direction}`] || GESTURE_ICONS.motion
    : gesture ? GESTURE_ICONS[gesture.gesture] || GESTURE_ICONS.motion
    : null;

  const label = swipe ? swipe.label : gesture ? gesture.label : '';

  if (!displayGesture) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim },
          ],
          opacity: opacityAnim,
          borderColor: displayGesture.color,
        },
      ]}
    >
      <Text style={styles.emoji}>{displayGesture.emoji}</Text>
      <Text style={[styles.label, { color: displayGesture.color }]}>{label}</Text>
      <View style={[styles.glow, { backgroundColor: displayGesture.color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    zIndex: 1000,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.full,
    opacity: 0.15,
    zIndex: -1,
  },
});
