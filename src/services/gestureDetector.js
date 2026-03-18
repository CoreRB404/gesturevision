/**
 * GestureDetector Service
 * 
 * Bridges gesture detection to Android native swipe control.
 * When the Accessibility Service is enabled, detected gestures
 * will perform REAL swipes on the Android screen.
 */

import { NativeModules, Platform } from 'react-native';
import { classifyGesture, detectSwipe, resetSwipeTracking } from './gestureClassifier';

const { GestureControl } = NativeModules;

// Callbacks
let onGestureCallback = null;
let onSwipeCallback = null;
let onStatusCallback = null;

export function setGestureCallback(cb) { onGestureCallback = cb; }
export function setSwipeCallback(cb) { onSwipeCallback = cb; }
export function setStatusCallback(cb) { onStatusCallback = cb; }

function updateStatus(status, detail = '') {
  if (onStatusCallback) onStatusCallback({ status, detail });
}

/**
 * Initialize the gesture detection system.
 */
export async function initializeDetector() {
  updateStatus('loading', 'Starting...');
  await new Promise(resolve => setTimeout(resolve, 500));
  updateStatus('ready', 'Ready');
  console.log('[GestureDetector] Ready');
  return true;
}

/**
 * Check if the Accessibility Service is enabled.
 */
export async function checkAccessibility() {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try {
    return await GestureControl.isAccessibilityEnabled();
  } catch (e) {
    return false;
  }
}

/**
 * Open Android Accessibility Settings.
 */
export async function openAccessibilitySettings() {
  if (Platform.OS !== 'android' || !GestureControl) return;
  try {
    await GestureControl.openAccessibilitySettings();
  } catch (e) {
    console.log('[GestureDetector] Could not open settings:', e);
  }
}

/**
 * Perform a native Android swipe via Accessibility Service.
 */
export async function performNativeSwipe(direction) {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try {
    return await GestureControl.performSwipe(direction);
  } catch (e) {
    console.log('[GestureDetector] Native swipe failed:', e.message);
    return false;
  }
}

/**
 * Trigger a gesture (from gesture buttons or MediaPipe)
 */
export function triggerGesture(gestureType) {
  const GESTURE_MAP = {
    open_palm: { gesture: 'open_palm', confidence: 1, emoji: '🖐️', label: 'Open Palm' },
    fist: { gesture: 'fist', confidence: 1, emoji: '✊', label: 'Fist' },
    peace: { gesture: 'peace', confidence: 1, emoji: '✌️', label: 'Peace' },
    thumbs_up: { gesture: 'thumbs_up', confidence: 1, emoji: '👍', label: 'Thumbs Up' },
    pointing: { gesture: 'pointing', confidence: 1, emoji: '👆', label: 'Pointing' },
  };
  const gesture = GESTURE_MAP[gestureType];
  if (gesture && onGestureCallback) onGestureCallback(gesture);
}

/**
 * Trigger a swipe — also performs native Android swipe if available.
 */
export function triggerSwipe(direction) {
  const SWIPE_MAP = {
    left: { direction: 'left', velocity: 0.5, emoji: '👈', label: 'Swipe Left' },
    right: { direction: 'right', velocity: 0.5, emoji: '👉', label: 'Swipe Right' },
    up: { direction: 'up', velocity: 0.5, emoji: '👆', label: 'Swipe Up' },
    down: { direction: 'down', velocity: 0.5, emoji: '👇', label: 'Swipe Down' },
  };
  const swipe = SWIPE_MAP[direction];
  if (swipe && onSwipeCallback) onSwipeCallback(swipe);
  
  // Also try native swipe
  performNativeSwipe(direction);
}

export function isReady() { return true; }
export function getError() { return null; }

export function cleanup() {
  resetSwipeTracking();
}

// --- Overlay Service Controls ---

export async function canDrawOverlays() {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try { return await GestureControl.canDrawOverlays(); }
  catch (e) { return false; }
}

export async function requestOverlayPermission() {
  if (Platform.OS !== 'android' || !GestureControl) return;
  try { await GestureControl.requestOverlayPermission(); }
  catch (e) { console.log('[GestureDetector] Overlay permission error:', e); }
}

export async function startOverlay() {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try { return await GestureControl.startOverlayService(); }
  catch (e) { console.log('[GestureDetector] Start overlay error:', e); return false; }
}

export async function stopOverlay() {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try { return await GestureControl.stopOverlayService(); }
  catch (e) { return false; }
}

export async function isOverlayRunning() {
  if (Platform.OS !== 'android' || !GestureControl) return false;
  try { return await GestureControl.isOverlayRunning(); }
  catch (e) { return false; }
}
