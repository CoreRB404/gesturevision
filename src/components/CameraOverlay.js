import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useCameraPermissions } from 'expo-camera';
import { MEDIAPIPE_HTML } from '../services/mediapipeHtml';
import {
  initializeDetector,
  setGestureCallback,
  setSwipeCallback,
  setStatusCallback,
  cleanup,
} from '../services/gestureDetector';

export default function CameraOverlay({ onGesture, onSwipe, visible = true }) {
  const [permission, requestPermission] = useCameraPermissions();
  const webviewRef = useRef(null);

  // Auto-request camera permission
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Set up gesture callbacks
  useEffect(() => {
    setGestureCallback(onGesture);
    setSwipeCallback(onSwipe);
    setStatusCallback(() => {});
    initializeDetector();
    return () => { setGestureCallback(null); setSwipeCallback(null); cleanup(); };
  }, [onGesture, onSwipe]);

  // Handle messages from WebView (MediaPipe detections)
  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'gesture' && onGesture) {
        onGesture({
          gesture: data.gesture,
          confidence: 1,
          emoji: data.emoji,
          label: data.label,
        });
      } else if (data.type === 'swipe' && onSwipe) {
        onSwipe({
          direction: data.direction,
          velocity: 0.5,
          emoji: data.emoji,
          label: data.label,
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [onGesture, onSwipe]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {permission?.granted && (
        <WebView
          ref={webviewRef}
          source={{ html: MEDIAPIPE_HTML, baseUrl: 'https://local.gesturevision' }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          allowsFullscreenVideo={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          androidLayerType="hardware"
          originWhitelist={['https://local.gesturevision']}
          mixedContentMode="never"
          mediaCapturePermissionGrantType="grant"
          onPermissionRequest={(request) => {
            if (request && request.grant) {
              request.grant(request.resources || []);
            }
          }}
          webviewDebuggingEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -10,
    left: -10,
    overflow: 'hidden',
    zIndex: -1,
  },
  webview: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});
