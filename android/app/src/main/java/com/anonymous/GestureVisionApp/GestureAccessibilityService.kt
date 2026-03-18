package com.anonymous.GestureVisionApp

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Path
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Accessibility Service that performs swipe gestures on the Android screen
 * and shows notification popups for gesture feedback.
 */
class GestureAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "GestureVisionAS"
        private const val CHANNEL_ID = "gesture_vision_channel"
        private const val NOTIFICATION_ID = 1001
        private const val GESTURE_NOTIFICATION_ID = 1002
        var instance: GestureAccessibilityService? = null
            private set
        
        fun isRunning(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        createNotificationChannel()
        showPersistentNotification()
        Log.d(TAG, "Accessibility Service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not used — we only need this service for gesture dispatch
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility Service interrupted")
    }

    override fun onDestroy() {
        instance = null
        val notifManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notifManager.cancelAll()
        Log.d(TAG, "Accessibility Service destroyed")
        super.onDestroy()
    }

    /**
     * Create notification channel for Android 8+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "GestureVision",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Gesture detection notifications"
                setShowBadge(false)
            }
            val notifManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notifManager.createNotificationChannel(channel)

            // High importance channel for gesture popups
            val gestureChannel = NotificationChannel(
                "${CHANNEL_ID}_gesture",
                "Gesture Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows detected gestures"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            notifManager.createNotificationChannel(gestureChannel)
        }
    }

    /**
     * Show a persistent notification indicating the service is active.
     */
    private fun showPersistentNotification() {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentTitle("GestureVision Active")
            .setContentText("Gesture detection is running")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()

        val notifManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notifManager.notify(NOTIFICATION_ID, notification)
    }

    /**
     * Show a heads-up notification popup for a detected gesture.
     */
    fun showGestureNotification(emoji: String, label: String, direction: String) {
        val notification = NotificationCompat.Builder(this, "${CHANNEL_ID}_gesture")
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentTitle("$emoji $label")
            .setContentText("Swipe $direction performed")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setAutoCancel(true)
            .setTimeoutAfter(2000) // Auto-dismiss after 2 seconds
            .build()

        val notifManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notifManager.notify(GESTURE_NOTIFICATION_ID, notification)
    }

    /**
     * Perform a swipe gesture on the screen and show notification.
     */
    fun performSwipe(direction: String): Boolean {
        val metrics = resources.displayMetrics
        val screenWidth = metrics.widthPixels.toFloat()
        val screenHeight = metrics.heightPixels.toFloat()

        val centerX = screenWidth / 2f
        val centerY = screenHeight / 2f
        val swipeDistance = screenWidth * 0.7f
        val verticalStart = screenHeight * 0.8f; val verticalEnd = screenHeight * 0.2f

        val path = Path()
        var emoji = ""
        var label = ""

        when (direction) {
            "left" -> {
                path.moveTo(centerX + swipeDistance / 2, centerY)
                path.lineTo(centerX - swipeDistance / 2, centerY)
                emoji = "👍"
                label = "Thumb → Right"
            }
            "right" -> {
                path.moveTo(centerX - swipeDistance / 2, centerY)
                path.lineTo(centerX + swipeDistance / 2, centerY)
                emoji = "🤙"
                label = "Pinky → Left"
            }
            "up" -> {
                path.moveTo(centerX, verticalStart)
                path.lineTo(centerX, verticalEnd)
                emoji = "✌️"
                label = "Peace → Up"
            }
            "down" -> {
                path.moveTo(centerX, verticalEnd)
                path.lineTo(centerX, verticalStart)
                emoji = "☝️"
                label = "Point → Down"
            }
            else -> return false
        }

        // Show notification popup
        showGestureNotification(emoji, label, direction)

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 450))
            .build()

        return dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d(TAG, "Swipe $direction completed")
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                Log.d(TAG, "Swipe $direction cancelled")
            }
        }, null)
    }
}
