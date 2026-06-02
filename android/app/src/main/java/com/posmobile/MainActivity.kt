package com.posmobile

import android.graphics.Rect
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "POSMobile"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableImmersiveFullScreen()
    setupKeyboardInsetsListener()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      enableImmersiveFullScreen()
    }
  }

  override fun onResume() {
    super.onResume()
    enableImmersiveFullScreen()
  }

  /** Allow window resize when the keyboard is open (edge-to-edge breaks adjustResize otherwise). */
  private fun setupKeyboardInsetsListener() {
    val rootView = window.decorView.findViewById<View>(android.R.id.content)
    rootView.viewTreeObserver.addOnGlobalLayoutListener {
      val visibleFrame = Rect()
      rootView.getWindowVisibleDisplayFrame(visibleFrame)
      val screenHeight = rootView.rootView.height
      val keyboardHeight = screenHeight - visibleFrame.bottom
      val keyboardOpen = keyboardHeight > screenHeight * 0.15
      WindowCompat.setDecorFitsSystemWindows(window, keyboardOpen)
    }
  }

  private fun enableImmersiveFullScreen() {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    WindowInsetsControllerCompat(window, window.decorView).apply {
      hide(
        WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars(),
      )
      systemBarsBehavior =
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
  }
}
