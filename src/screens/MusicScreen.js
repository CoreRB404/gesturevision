import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadows } from '../styles/theme';

const { width } = Dimensions.get('window');

const SONGS = [
  { id: 1, title: 'Midnight Dreams', artist: 'Luna Nova', duration: '3:42', gradient: ['#6c5ce7', '#a29bfe'] },
  { id: 2, title: 'Electric Pulse', artist: 'Neon Waves', duration: '4:15', gradient: ['#00cec9', '#81ecec'] },
  { id: 3, title: 'Starlight Serenade', artist: 'Cosmic Echo', duration: '3:58', gradient: ['#fd79a8', '#e84393'] },
  { id: 4, title: 'Ocean Breeze', artist: 'Wave Runner', duration: '5:01', gradient: ['#74b9ff', '#0984e3'] },
  { id: 5, title: 'Golden Hour', artist: 'Sunset Blvd', duration: '3:33', gradient: ['#ffeaa7', '#fdcb6e'] },
  { id: 6, title: 'Neon Nights', artist: 'Cyber Drift', duration: '4:27', gradient: ['#55efc4', '#00b894'] },
];

// Animated equalizer bars
function Equalizer({ isPlaying }) {
  const bars = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.5)).current, useRef(new Animated.Value(0.7)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.6)).current];

  useEffect(() => {
    if (isPlaying) {
      bars.forEach((bar, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 300 + i * 100,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: Math.random() * 0.4 + 0.1,
              duration: 300 + i * 80,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.eqContainer}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.eqBar,
            {
              transform: [{ scaleY: bar }],
              backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
            },
          ]}
        />
      ))}
    </View>
  );
}

function SongItem({ song, index, isActive, onPress }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
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
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity
        style={[styles.songItem, isActive && styles.songItemActive]}
        onPress={() => onPress(song)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={song.gradient}
          style={styles.songArt}
        >
          <Ionicons
            name={isActive ? 'pause' : 'musical-notes'}
            size={18}
            color="rgba(255,255,255,0.9)"
          />
        </LinearGradient>
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isActive && { color: colors.primary }]}>
            {song.title}
          </Text>
          <Text style={styles.songArtist}>{song.artist}</Text>
        </View>
        <Text style={styles.songDuration}>{song.duration}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MusicScreen() {
  const [currentSong, setCurrentSong] = useState(SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0.35);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Rotate album art animation
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        {/* Now Playing Card */}
        <View style={styles.nowPlayingCard}>
          <LinearGradient
            colors={currentSong.gradient.map(c => c + '20')}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Album Art */}
          <Animated.View style={[styles.albumArt, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={currentSong.gradient}
              style={styles.albumGradient}
            >
              <View style={styles.albumHole} />
              <Ionicons name="musical-notes" size={32} color="rgba(255,255,255,0.5)" style={styles.albumIcon} />
            </LinearGradient>
          </Animated.View>

          {/* Equalizer */}
          <Equalizer isPlaying={isPlaying} />

          {/* Song Info */}
          <Text style={styles.npTitle}>{currentSong.title}</Text>
          <Text style={styles.npArtist}>{currentSong.artist}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={currentSong.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
              <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.progressTime}>1:18</Text>
              <Text style={styles.progressTime}>{currentSong.duration}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity>
              <Ionicons name="shuffle-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.playButtonGradient}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={28}
                  color={colors.text}
                />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="play-skip-forward" size={28} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="repeat-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist */}
        <Text style={styles.sectionTitle}>Up Next</Text>
        {SONGS.map((song, index) => (
          <SongItem
            key={song.id}
            song={song}
            index={index}
            isActive={currentSong.id === song.id}
            onPress={(s) => { setCurrentSong(s); setIsPlaying(true); }}
          />
        ))}

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + 20,
  },
  nowPlayingCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  albumArt: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  albumGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumHole: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  albumIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  eqContainer: {
    flexDirection: 'row',
    height: 40,
    gap: 3,
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  eqBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    transformOrigin: 'bottom',
  },
  npTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  npArtist: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing.lg,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    marginLeft: -6,
    ...shadows.small,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadows.glow,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    gap: spacing.md,
  },
  songItemActive: {
    backgroundColor: 'rgba(108,92,231,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.3)',
  },
  songArt: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  songArtist: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  songDuration: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
