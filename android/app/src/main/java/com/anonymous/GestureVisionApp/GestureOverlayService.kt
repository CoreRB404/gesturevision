package com.anonymous.GestureVisionApp

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import android.view.*
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.app.NotificationCompat

/**
 * Foreground Service that keeps a floating icon + invisible WebView camera overlay
 * running on top of all apps. The WebView runs MediaPipe for gesture detection.
 * When a gesture is detected, it triggers the Accessibility Service to perform swipes.
 */
class GestureOverlayService : Service() {

    companion object {
        private const val TAG = "GestureOverlay"
        private const val CHANNEL_ID = "gesture_overlay_channel"
        private const val NOTIFICATION_ID = 2001
        var instance: GestureOverlayService? = null
            private set
        
        fun isRunning(): Boolean = instance != null
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var webView: WebView? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        createOverlay()
        Log.d(TAG, "Overlay Service started")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        instance = null
        removeOverlay()
        Log.d(TAG, "Overlay Service stopped")
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Gesture Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps gesture detection active in background"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentTitle("GestureVision Running")
            .setContentText("Gesture detection active in background")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun createOverlay() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Create the container layout
        val container = FrameLayout(this)

        // --- Floating Icon (visible, draggable) ---
        val icon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_camera)
            setColorFilter(Color.parseColor("#6c5ce7"))
            setBackgroundColor(Color.parseColor("#1a1a2e"))
            setPadding(24, 24, 24, 24)
        }

        val iconSize = 56
        val iconSizePx = (iconSize * resources.displayMetrics.density).toInt()

        val iconParams = FrameLayout.LayoutParams(iconSizePx, iconSizePx).apply {
            gravity = Gravity.TOP or Gravity.START
        }
        container.addView(icon, iconParams)

        // --- Hidden WebView (invisible, runs camera + MediaPipe) ---
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Allow camera in WebView
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.grant(request.resources)
                }
            }

            // Handle gesture messages from the WebView
            addJavascriptInterface(GestureJSInterface(), "AndroidGesture")

            setBackgroundColor(Color.TRANSPARENT)
        }

        // WebView is 1x1 pixel, invisible
        val webParams = FrameLayout.LayoutParams(1, 1).apply {
            gravity = Gravity.BOTTOM or Gravity.END
        }
        container.addView(webView, webParams)

        // --- Window overlay params ---
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            iconSizePx,
            iconSizePx,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 20
            y = 200
        }

        // Make icon draggable
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        icon.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX - (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(overlayView, params)
                    true
                }
                else -> false
            }
        }

        overlayView = container

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add overlay: ${e.message}")
        }

        // Load the MediaPipe HTML with a bridge to send gestures back
        loadMediaPipeHtml()
    }

    private fun loadMediaPipeHtml() {
        // Get the MediaPipe HTML but modify it to call Android bridge instead of ReactNativeWebView
        val html = getMediaPipeHtml()
        webView?.loadDataWithBaseURL("https://localhost", html, "text/html", "UTF-8", null)
    }

    private fun removeOverlay() {
        try {
            webView?.destroy()
            webView = null
            overlayView?.let { windowManager?.removeView(it) }
            overlayView = null
        } catch (e: Exception) {
            Log.e(TAG, "Error removing overlay: ${e.message}")
        }
    }

    /**
     * JavaScript interface that the WebView calls when a gesture is detected.
     */
    inner class GestureJSInterface {
        @JavascriptInterface
        fun onGesture(direction: String, emoji: String, label: String) {
            Log.d(TAG, "Gesture detected: $direction ($label)")
            
            // Perform the swipe via Accessibility Service
            val accessibilityService = GestureAccessibilityService.instance
            if (accessibilityService != null) {
                accessibilityService.performSwipe(direction)
            } else {
                Log.d(TAG, "Accessibility Service not running")
            }
        }
    }

    /**
     * MediaPipe HTML that uses AndroidGesture bridge instead of ReactNativeWebView
     */
    private fun getMediaPipeHtml(): String {
        return """
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
  <style>
    * { margin:0; padding:0; }
    body { background:#000; overflow:hidden; }
    #video { position:fixed; top:0; left:0; width:1px; height:1px; opacity:0; }
    canvas { display:none; }
  </style>
</head>
<body>
  <video id="video" playsinline autoplay muted></video>
  <canvas id="canvas"></canvas>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js"></script>
  <script>
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let lastGestureTime = 0;
    const GESTURE_COOLDOWN = 1200;
    let currentGesture = null;
    let gestureStartTime = 0;
    const HOLD_DURATION = 600;

    function isFingerExtended(landmarks, tipIdx, mcpIdx) {
      const wrist = landmarks[0];
      const tip = landmarks[tipIdx];
      const mcp = landmarks[mcpIdx];
      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
      return tipDist > mcpDist * 1.15;
    }

    function isThumbExtended(landmarks) {
      const thumbTip = landmarks[4];
      const palmCenter = landmarks[9];
      const wrist = landmarks[0];
      const indexPip = landmarks[6];
      const thumbToPalm = Math.hypot(thumbTip.x - palmCenter.x, thumbTip.y - palmCenter.y);
      const thumbToIndex = Math.hypot(thumbTip.x - indexPip.x, thumbTip.y - indexPip.y);
      const palmSize = Math.hypot(wrist.x - palmCenter.x, wrist.y - palmCenter.y);
      const normPalm = thumbToPalm / (palmSize + 0.001);
      const normIndex = thumbToIndex / (palmSize + 0.001);
      return normPalm > 0.9 && normIndex > 0.7;
    }

    function classifyGesture(landmarks) {
      const thumb = isThumbExtended(landmarks);
      const index = isFingerExtended(landmarks, 8, 5);
      const middle = isFingerExtended(landmarks, 12, 9);
      const ring = isFingerExtended(landmarks, 16, 13);
      const pinky = isFingerExtended(landmarks, 20, 17);

      if (index && middle && !ring && !pinky)
        return { direction: 'up', emoji: '✌️', label: 'Peace → Up' };
      if (index && !middle && !ring && !pinky && !thumb)
        return { direction: 'down', emoji: '☝️', label: 'Point → Down' };
      if (thumb && !index && !middle && !ring && !pinky)
        return { direction: 'left', emoji: '👍', label: 'Thumb → Right' };
      if (pinky && !index && !middle && !ring)
        return { direction: 'right', emoji: '🤙', label: 'Pinky → Left' };
      return null;
    }

    const hands = new Hands({
      locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const now = Date.now();
        const gesture = classifyGesture(landmarks);

        if (gesture) {
          if (currentGesture === gesture.direction) {
            if (now - gestureStartTime >= HOLD_DURATION && now - lastGestureTime > GESTURE_COOLDOWN) {
              lastGestureTime = now;
              // Send to Android native bridge
              if (window.AndroidGesture) {
                window.AndroidGesture.onGesture(gesture.direction, gesture.emoji, gesture.label);
              }
            }
          } else {
            currentGesture = gesture.direction;
            gestureStartTime = now;
          }
        } else {
          currentGesture = null;
        }
      } else {
        currentGesture = null;
      }
    });

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 }
        });
        video.srcObject = stream;
        await video.play();
        
        async function processFrame() {
          if (video.readyState >= 2) {
            await hands.send({ image: video });
          }
          requestAnimationFrame(processFrame);
        }
        processFrame();
      } catch (e) {
        console.error('Camera error:', e);
      }
    }
    startCamera();
  </script>
</body>
</html>
        """.trimIndent()
    }
}
