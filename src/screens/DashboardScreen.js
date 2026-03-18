import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadows, glass } from '../styles/theme';

const { width } = Dimensions.get('window');

// Get weather icon based on WMO weather code
function getWeatherInfo(code) {
  if (code <= 1) return { icon: 'sunny', color: '#ffd93d', desc: 'Clear Sky' };
  if (code <= 3) return { icon: 'partly-sunny', color: '#ffa801', desc: 'Partly Cloudy' };
  if (code <= 48) return { icon: 'cloud', color: '#a4b0be', desc: 'Cloudy' };
  if (code <= 57) return { icon: 'rainy', color: '#74b9ff', desc: 'Drizzle' };
  if (code <= 67) return { icon: 'rainy', color: '#0984e3', desc: 'Rain' };
  if (code <= 77) return { icon: 'snow', color: '#dfe6e9', desc: 'Snow' };
  if (code <= 82) return { icon: 'rainy', color: '#0984e3', desc: 'Rain Showers' };
  if (code <= 86) return { icon: 'snow', color: '#dfe6e9', desc: 'Snow Showers' };
  if (code <= 99) return { icon: 'thunderstorm', color: '#fdcb6e', desc: 'Thunderstorm' };
  return { icon: 'cloud', color: '#a4b0be', desc: 'Unknown' };
}

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

function WeatherDay({ item, index, isToday }) {
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

  const weather = getWeatherInfo(item.code);

  return (
    <Animated.View
      style={[
        styles.dayCard,
        isToday && styles.dayCardActive,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={[styles.dayText, isToday && { color: colors.text }]}>
        {item.day}
      </Text>
      <Ionicons name={weather.icon} size={22} color={weather.color} />
      <Text style={[styles.tempSmall, isToday && { color: colors.text }]}>
        {Math.round(item.tempMax)}°
      </Text>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const time = useCurrentTime();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [city, setCity] = useState('Loading...');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch location and weather
  useEffect(() => {
    (async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCity('Location denied');
          return;
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const { latitude, longitude } = location.coords;

        // Reverse geocode for city name
        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            setCity(place.city || place.subregion || place.region || 'Unknown Location');
          }
        } catch (e) {
          setCity('Location Loaded'); // Generic fallback
        }

        // Fetch weather from Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        
        const data = await response.json();

        if (data.current) {
          setCurrentWeather({
            temp: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            code: data.current.weather_code,
          });
          setStats([
            { label: 'Humidity', value: `${data.current.relative_humidity_2m}%`, icon: 'water-outline', color: colors.secondary },
            { label: 'Wind', value: `${Math.round(data.current.wind_speed_10m)} km/h`, icon: 'navigate-outline', color: colors.primaryLight },
            { label: 'Feels Like', value: `${Math.round(data.current.apparent_temperature)}°`, icon: 'thermometer-outline', color: colors.warningDark },
            { label: 'Pressure', value: `${Math.round(data.current.surface_pressure)}`, icon: 'speedometer-outline', color: colors.accent },
          ]);
        }

        if (data.daily) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dailyForecast = data.daily.time.map((dateStr, i) => {
            const d = new Date(dateStr + 'T00:00:00');
            return {
              day: days[d.getDay()],
              tempMax: data.daily.temperature_2m_max[i],
              tempMin: data.daily.temperature_2m_min[i],
              code: data.daily.weather_code[i],
            };
          });
          setForecast(dailyForecast);
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
        setCity('Offline');
      }
    })();
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const mins = time.getMinutes().toString().padStart(2, '0');
  const secs = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const currentWeatherInfo = currentWeather ? getWeatherInfo(currentWeather.code) : null;

  const defaultStats = [
    { label: 'Humidity', value: '--', icon: 'water-outline', color: colors.secondary },
    { label: 'Wind', value: '--', icon: 'navigate-outline', color: colors.primaryLight },
    { label: 'Feels Like', value: '--', icon: 'thermometer-outline', color: colors.warningDark },
    { label: 'Pressure', value: '--', icon: 'speedometer-outline', color: colors.accent },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient
        colors={[colors.bg, '#0d0d1a', colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        {/* Time Card */}
        <View style={styles.timeCard}>
          <LinearGradient
            colors={['rgba(108,92,231,0.2)', 'rgba(162,155,254,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.dateText}>{dateStr}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{hours}</Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Text style={styles.timeText}>{mins}</Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Text style={styles.timeSecText}>{secs}</Text>
          </View>
        </View>

        {/* Main Weather Card */}
        <View style={styles.weatherMainCard}>
          <LinearGradient
            colors={['rgba(0,206,201,0.12)', 'rgba(0,206,201,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherMainLeft}>
            <Ionicons
              name={currentWeatherInfo ? currentWeatherInfo.icon : 'cloud'}
              size={48}
              color={currentWeatherInfo ? currentWeatherInfo.color : '#a4b0be'}
            />
            <Text style={styles.tempMain}>
              {currentWeather ? `${currentWeather.temp}°C` : '--°C'}
            </Text>
          </View>
          <View style={styles.weatherMainRight}>
            <Text style={styles.weatherCity}>{city}</Text>
            <Text style={styles.weatherDesc}>
              {currentWeatherInfo ? currentWeatherInfo.desc : 'Loading...'}
            </Text>
            <Text style={styles.weatherFeels}>
              {currentWeather ? `Feels like ${currentWeather.feelsLike}°` : '...'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {(stats || defaultStats).map((stat, i) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Forecast */}
        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        <View style={styles.weekRow}>
          {forecast.length > 0 ? forecast.map((item, index) => (
            <WeatherDay key={item.day + index} item={item} index={index} isToday={index === 0} />
          )) : (
            <Text style={styles.loadingText}>Loading forecast...</Text>
          )}
        </View>

        <View style={{ height: 20 }} />
      </Animated.ScrollView>
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
  timeCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 56,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  timeSecText: {
    fontSize: 32,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  weatherMainCard: {
    flexDirection: 'row',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weatherMainLeft: {
    alignItems: 'center',
    marginRight: spacing.xl,
    gap: spacing.sm,
  },
  tempMain: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  weatherMainRight: {
    flex: 1,
    justifyContent: 'center',
  },
  weatherCity: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  weatherDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  weatherFeels: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCard: {
    alignItems: 'center',
    padding: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    flex: 1,
    gap: spacing.xs,
  },
  dayCardActive: {
    backgroundColor: 'rgba(108,92,231,0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  tempSmall: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    flex: 1,
    paddingVertical: spacing.lg,
  },
});
