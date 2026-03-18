import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../styles/theme';

const { width } = Dimensions.get('window');
const COLUMN_GAP = spacing.sm;
const COLUMN_WIDTH = (width - spacing.lg * 2 - COLUMN_GAP) / 2;

// Generate placeholder images with gradients
const GALLERY_ITEMS = [
  { id: 1, h: 180, gradient: ['#6c5ce7', '#a29bfe'], icon: 'planet-outline', label: 'Space' },
  { id: 2, h: 240, gradient: ['#00cec9', '#81ecec'], icon: 'leaf-outline', label: 'Nature' },
  { id: 3, h: 200, gradient: ['#fd79a8', '#e84393'], icon: 'heart-outline', label: 'Abstract' },
  { id: 4, h: 160, gradient: ['#ffeaa7', '#fdcb6e'], icon: 'sunny-outline', label: 'Sunset' },
  { id: 5, h: 220, gradient: ['#55efc4', '#00b894'], icon: 'water-outline', label: 'Ocean' },
  { id: 6, h: 180, gradient: ['#e17055', '#d63031'], icon: 'flame-outline', label: 'Fire' },
  { id: 7, h: 260, gradient: ['#74b9ff', '#0984e3'], icon: 'cloud-outline', label: 'Sky' },
  { id: 8, h: 190, gradient: ['#dfe6e9', '#636e72'], icon: 'diamond-outline', label: 'Crystal' },
  { id: 9, h: 210, gradient: ['#a29bfe', '#6c5ce7'], icon: 'moon-outline', label: 'Night' },
  { id: 10, h: 170, gradient: ['#fab1a0', '#e17055'], icon: 'flower-outline', label: 'Garden' },
];

function GalleryCard({ item, index, column }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          height: item.h,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <Ionicons name={item.icon} size={36} color="rgba(255,255,255,0.7)" />
        <View style={styles.cardLabel}>
          <Text style={styles.cardLabelText}>{item.label}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const CATEGORIES = ['All', 'Nature', 'Abstract', 'Space', 'Minimal'];

export default function GalleryScreen() {
  const [activeCategory, setActiveCategory] = React.useState('All');

  // Split items into two columns (masonry layout)
  const leftColumn = GALLERY_ITEMS.filter((_, i) => i % 2 === 0);
  const rightColumn = GALLERY_ITEMS.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.bg, '#0d0d1a', colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Gallery</Text>
        <Text style={styles.subtitle}>Explore stunning visuals</Text>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <View
              key={cat}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                {cat}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Masonry Grid */}
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {leftColumn.map((item, index) => (
              <GalleryCard key={item.id} item={item} index={index} column="left" />
            ))}
          </View>
          <View style={styles.column}>
            {rightColumn.map((item, index) => (
              <GalleryCard key={item.id} item={item} index={index} column="right" />
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: spacing.xxl + 20,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  categoriesRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  categoryTextActive: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  cardLabelText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fontWeight.medium,
  },
});
