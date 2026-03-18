import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AppNavigator from './src/navigation/AppNavigator';
import CameraOverlay from './src/components/CameraOverlay';
import GestureIndicator from './src/components/GestureIndicator';
import { performNativeSwipe } from './src/services/gestureDetector';

const TAB_ORDER = ['Home', 'Dashboard', 'Settings'];

export default function App() {
  const navigationRef = useRef(null);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [currentSwipe, setCurrentSwipe] = useState(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(true);
  const gestureTimerRef = useRef(null);
  const lastSwipeRef = useRef(0);
  const lastGestureRef = useRef(0);

  // Navigate to a specific tab by index
  const navigateToTab = useCallback((tabIndex) => {
    if (navigationRef.current) {
      const tabName = TAB_ORDER[Math.max(0, Math.min(tabIndex, TAB_ORDER.length - 1))];
      navigationRef.current.navigate(tabName);
    }
  }, []);

  // Get current tab index
  const getCurrentTabIndex = useCallback(() => {
    if (navigationRef.current) {
      const state = navigationRef.current.getState();
      if (state) return state.index || 0;
    }
    return 0;
  }, []);

  // Handle gesture detection
  const handleGesture = useCallback((gesture) => {
    const now = Date.now();
    if (now - lastGestureRef.current < 1500) return;
    lastGestureRef.current = now;

    setCurrentGesture(gesture);
    setShowIndicator(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = setTimeout(() => {
      setShowIndicator(false);
      setCurrentGesture(null);
    }, 2000);
  }, [navigateToTab]);

  // Handle swipe detection
  const handleSwipe = useCallback((swipe) => {
    const now = Date.now();
    if (now - lastSwipeRef.current < 1000) return;
    lastSwipeRef.current = now;

    setCurrentSwipe(swipe);
    setShowIndicator(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const currentIndex = getCurrentTabIndex();

    switch (swipe.direction) {
      case 'left':
        if (currentIndex < TAB_ORDER.length - 1) {
          navigateToTab(currentIndex + 1);
        }
        performNativeSwipe('left');
        break;
      case 'right':
        if (currentIndex > 0) {
          navigateToTab(currentIndex - 1);
        }
        performNativeSwipe('right');
        break;
      case 'up':
        performNativeSwipe('up');
        break;
      case 'down':
        performNativeSwipe('down');
        break;
    }

    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = setTimeout(() => {
      setShowIndicator(false);
      setCurrentSwipe(null);
    }, 2000);
  }, [getCurrentTabIndex, navigateToTab]);

  useEffect(() => {
    return () => {
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0a0a0f"
          translucent={false}
        />

        <NavigationContainer ref={navigationRef}>
          <AppNavigator navigationRef={navigationRef} />
        </NavigationContainer>

        <GestureIndicator
          gesture={currentGesture}
          swipe={currentSwipe}
          visible={showIndicator}
        />

        <CameraOverlay
          onGesture={handleGesture}
          onSwipe={handleSwipe}
          visible={true}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});

