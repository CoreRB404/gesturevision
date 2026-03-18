/**
 * MediaPipe Hands HTML
 * 
 * This HTML runs inside a WebView and provides REAL hand gesture detection
 * using Google's MediaPipe Hands ML model. It:
 * 1. Accesses the front camera via getUserMedia
 * 2. Runs MediaPipe Hands for 21-landmark hand detection
 * 3. Classifies gestures (open palm, fist, peace, thumbs up, swipes)
 * 4. Sends detected gestures to React Native via postMessage
 */

export const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0a0a0f; 
      overflow: hidden; 
      width: 100vw; 
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #videoContainer {
      position: relative;
      width: 100%;
      height: 100%;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: scaleX(-1);
    }
    #status {
      position: absolute;
      bottom: 8px;
      left: 8px;
      color: #55efc4;
      font-size: 10px;
      font-family: monospace;
      background: rgba(0,0,0,0.6);
      padding: 2px 6px;
      border-radius: 4px;
      z-index: 10;
    }
    #gesture {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      font-family: sans-serif;
      background: rgba(108,92,231,0.7);
      padding: 4px 12px;
      border-radius: 12px;
      z-index: 10;
      display: none;
    }
  </style>
</head>
<body>
  <div id="videoContainer">
    <video id="video" playsinline autoplay muted></video>
    <canvas id="canvas"></canvas>
    <div id="status">Loading AI...</div>
    <div id="gesture"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.min.js"></script>

  <script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('status');
    const gestureEl = document.getElementById('gesture');

    let lastGestureTime = 0;
    const GESTURE_COOLDOWN = 1200;
    let currentGesture = null;
    let gestureStartTime = 0;
    const HOLD_DURATION = 600; // Must hold gesture for 600ms to trigger

    // Send message to React Native
    function sendToRN(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    // Check if finger is extended (tip is farther from wrist than knuckle)
    function isFingerExtended(landmarks, tipIdx, mcpIdx) {
      const wrist = landmarks[0];
      const tip = landmarks[tipIdx];
      const mcp = landmarks[mcpIdx];
      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
      return tipDist > mcpDist * 1.15;
    }

    // Check thumb is EXTENDED (far from palm center)
    function isThumbExtended(landmarks) {
      const thumbTip = landmarks[4];
      const palmCenter = landmarks[9];  // middle finger MCP = palm center
      const wrist = landmarks[0];
      const indexPip = landmarks[6];    // index finger middle knuckle
      
      // Distance from thumb tip to palm center
      // Extended: thumb tip is FAR from palm center
      // Curled: thumb tip wraps close to palm
      const thumbToPalm = Math.hypot(thumbTip.x - palmCenter.x, thumbTip.y - palmCenter.y);
      
      // Distance from thumb tip to index finger knuckle
      // Curled: very close (thumb rests against index). Extended: far away
      const thumbToIndex = Math.hypot(thumbTip.x - indexPip.x, thumbTip.y - indexPip.y);
      
      // Palm size for normalization (wrist to palm center)
      const palmSize = Math.hypot(wrist.x - palmCenter.x, wrist.y - palmCenter.y);
      
      // Normalized distances
      const normPalm = thumbToPalm / (palmSize + 0.001);
      const normIndex = thumbToIndex / (palmSize + 0.001);
      
      
      // Extended thumb: far from palm AND far from index knuckle
      
      // Extended thumb: far from palm AND far from index knuckle
      return normPalm > 0.9 && normIndex > 0.7;
    }

    // Classify static gesture
    function classifyGesture(landmarks) {
      const thumb = isThumbExtended(landmarks);
      const index = isFingerExtended(landmarks, 8, 5);
      const middle = isFingerExtended(landmarks, 12, 9);
      const ring = isFingerExtended(landmarks, 16, 13);
      const pinky = isFingerExtended(landmarks, 20, 17);

      // ✌️ Peace (index + middle up, others down) = UP
      if (index && middle && !ring && !pinky) {
        return { direction: 'up', emoji: '✌️', label: 'Peace → Up' };
      }

      // ☝️ Pointing (only index up) = DOWN
      if (index && !middle && !ring && !pinky && !thumb) {
        return { direction: 'down', emoji: '☝️', label: 'Point → Down' };
      }

      // 👍 Thumb (only thumb up) = LEFT
      if (thumb && !index && !middle && !ring && !pinky) {
        return { direction: 'left', emoji: '👍', label: 'Thumb → Right' };
      }

      // 🤙 Pinky (only pinky up) = RIGHT
      if (pinky && !index && !middle && !ring) {
        return { direction: 'right', emoji: '🤙', label: 'Pinky → Left' };
      }

      return null;
    }

    // Draw hand landmarks on canvas
    function drawLandmarks(landmarks) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17]
      ];

      ctx.strokeStyle = 'rgba(108, 92, 231, 0.7)';
      ctx.lineWidth = 2;
      for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
        ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height);
        ctx.stroke();
      }

      // Draw points
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = [4,8,12,16,20].includes(i) ? '#55efc4' : '#6c5ce7';
        ctx.fill();
      }
    }

    // Show gesture label
    function showGesture(text) {
      gestureEl.textContent = text;
      gestureEl.style.display = 'block';
      clearTimeout(gestureEl._timer);
      gestureEl._timer = setTimeout(() => { gestureEl.style.display = 'none'; }, 1500);
    }

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Draw hand skeleton
        drawLandmarks(landmarks);

        const now = Date.now();
        
        // Classify the current gesture
        const gesture = classifyGesture(landmarks);
        
        if (gesture) {
          // Check if same gesture is being held
          if (currentGesture === gesture.direction) {
            // Held long enough? Fire it!
            if (now - gestureStartTime >= HOLD_DURATION && now - lastGestureTime > GESTURE_COOLDOWN) {
              lastGestureTime = now;
              showGesture(gesture.emoji + ' ' + gesture.label);
              sendToRN({ type: 'swipe', ...gesture });
            }
          } else {
            // New gesture detected, start timing
            currentGesture = gesture.direction;
            gestureStartTime = now;
          }
          
          statusEl.textContent = gesture.emoji + ' ' + gesture.label;
          statusEl.style.color = '#55efc4';
        } else {
          currentGesture = null;
          statusEl.textContent = '✋ Hand detected';
          statusEl.style.color = '#55efc4';
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentGesture = null;
        statusEl.textContent = '👁️ Scanning...';
        statusEl.style.color = '#a29bfe';
      }
    });

    // Start camera
    async function startCamera() {
      try {
        statusEl.textContent = 'Starting camera...';
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 }
        });
        video.srcObject = stream;
        await video.play();

        statusEl.textContent = 'Loading AI model...';
        
        // Process frames
        async function processFrame() {
          if (video.readyState >= 2) {
            await hands.send({ image: video });
          }
          requestAnimationFrame(processFrame);
        }
        
        await hands.initialize();
        statusEl.textContent = '✅ AI Ready';
        statusEl.style.color = '#55efc4';
        sendToRN({ type: 'status', status: 'ready' });
        processFrame();
      } catch (err) {
        statusEl.textContent = '❌ ' + err.message;
        statusEl.style.color = '#ff7675';
        sendToRN({ type: 'status', status: 'error', detail: err.message });
      }
    }

    startCamera();
  </script>
</body>
</html>
`;
