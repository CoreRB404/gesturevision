/**
 * Gesture Classifier
 * Analyzes 21 hand landmarks from hand-pose-detection model
 * to classify static and dynamic hand gestures.
 *
 * Landmark indices (MediaPipe Hands):
 * 0: wrist
 * 1-4: thumb (CMC, MCP, IP, TIP)
 * 5-8: index (MCP, PIP, DIP, TIP)
 * 9-12: middle (MCP, PIP, DIP, TIP)
 * 13-16: ring (MCP, PIP, DIP, TIP)
 * 17-20: pinky (MCP, PIP, DIP, TIP)
 */

// Check if a finger is extended by comparing tip to PIP joint position
function isFingerExtended(landmarks, fingerTipIdx, fingerPipIdx) {
  if (!landmarks || !landmarks[fingerTipIdx] || !landmarks[fingerPipIdx]) return false;
  // A finger is extended if tip.y < pip.y (in screen coords, y increases downward)
  return landmarks[fingerTipIdx].y < landmarks[fingerPipIdx].y;
}

// Special check for thumb (uses x-axis primarily)
function isThumbExtended(landmarks, handedness) {
  if (!landmarks || !landmarks[4] || !landmarks[2]) return false;
  const tip = landmarks[4];
  const mcp = landmarks[2];
  // For right hand, thumb extends left (tip.x < mcp.x)
  // For left hand, thumb extends right (tip.x > mcp.x)
  if (handedness === 'Right') {
    return tip.x < mcp.x;
  }
  return tip.x > mcp.x;
}

// Count extended fingers
function countExtendedFingers(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length < 21) return 0;

  let count = 0;
  if (isThumbExtended(landmarks, handedness)) count++;
  if (isFingerExtended(landmarks, 8, 6)) count++;   // index
  if (isFingerExtended(landmarks, 12, 10)) count++;  // middle
  if (isFingerExtended(landmarks, 16, 14)) count++;  // ring
  if (isFingerExtended(landmarks, 20, 18)) count++;  // pinky
  return count;
}

// Get hand center (average of all keypoints)
function getHandCenter(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  let sumX = 0, sumY = 0;
  for (const lm of landmarks) {
    sumX += lm.x;
    sumY += lm.y;
  }
  return {
    x: sumX / landmarks.length,
    y: sumY / landmarks.length,
  };
}

// Classify gesture from landmarks
export function classifyGesture(landmarks, handedness = 'Right') {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'none', confidence: 0 };
  }

  const fingerCount = countExtendedFingers(landmarks, handedness);
  const thumbUp = isThumbExtended(landmarks, handedness);
  const indexUp = isFingerExtended(landmarks, 8, 6);
  const middleUp = isFingerExtended(landmarks, 12, 10);
  const ringUp = isFingerExtended(landmarks, 16, 14);
  const pinkyUp = isFingerExtended(landmarks, 20, 18);

  // Open Palm: all 5 fingers extended
  if (fingerCount >= 4) {
    return { gesture: 'open_palm', confidence: 0.9, emoji: '🖐️', label: 'Open Palm' };
  }

  // Fist: 0 or 1 fingers extended
  if (fingerCount <= 1 && !indexUp && !middleUp) {
    return { gesture: 'fist', confidence: 0.85, emoji: '✊', label: 'Fist' };
  }

  // Peace sign: index + middle up, others down
  if (indexUp && middleUp && !ringUp && !pinkyUp && fingerCount <= 3) {
    return { gesture: 'peace', confidence: 0.9, emoji: '✌️', label: 'Peace' };
  }

  // Thumbs up: only thumb extended
  if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
    return { gesture: 'thumbs_up', confidence: 0.85, emoji: '👍', label: 'Thumbs Up' };
  }

  // Pointing: only index extended
  if (indexUp && !middleUp && !ringUp && !pinkyUp && fingerCount <= 2) {
    return { gesture: 'pointing', confidence: 0.85, emoji: '👆', label: 'Pointing' };
  }

  return { gesture: 'unknown', confidence: 0.3, emoji: '❓', label: 'Unknown' };
}

// Track swipe gestures by comparing hand center positions over time
const SWIPE_THRESHOLD = 0.15; // 15% of frame width
const SWIPE_TIME_WINDOW = 500; // ms

let positionHistory = [];

export function detectSwipe(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;

  const center = getHandCenter(landmarks);
  if (!center) return null;

  const now = Date.now();
  positionHistory.push({ ...center, time: now });

  // Keep only recent positions
  positionHistory = positionHistory.filter(p => now - p.time < SWIPE_TIME_WINDOW);

  if (positionHistory.length < 3) return null;

  const oldest = positionHistory[0];
  const newest = positionHistory[positionHistory.length - 1];
  const dx = newest.x - oldest.x;
  const dy = newest.y - oldest.y;
  const timeDiff = newest.time - oldest.time;

  if (timeDiff < 100) return null; // Too fast, likely noise

  // Check horizontal swipe
  if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
    // Clear history after detecting swipe to prevent repeated detection
    positionHistory = [];
    if (dx > 0) {
      return { direction: 'right', velocity: dx / timeDiff, emoji: '👉', label: 'Swipe Right' };
    } else {
      return { direction: 'left', velocity: Math.abs(dx) / timeDiff, emoji: '👈', label: 'Swipe Left' };
    }
  }

  // Check vertical swipe
  if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.5) {
    positionHistory = [];
    if (dy > 0) {
      return { direction: 'down', velocity: dy / timeDiff, emoji: '👇', label: 'Swipe Down' };
    } else {
      return { direction: 'up', velocity: Math.abs(dy) / timeDiff, emoji: '👆', label: 'Swipe Up' };
    }
  }

  return null;
}

export function resetSwipeTracking() {
  positionHistory = [];
}

export { getHandCenter, countExtendedFingers };
