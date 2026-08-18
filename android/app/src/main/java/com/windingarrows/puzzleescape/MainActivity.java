package com.windingarrows.puzzleescape;

import android.os.Bundle;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Apply System Window Insets Padding directly to the Android App Container
        // This physically shifts the WebView viewport BELOW the camera notch/status bar and ABOVE the navigation bar!
        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
                Insets statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout());
                Insets navBarInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());

                v.setPadding(
                    statusBarInsets.left,
                    statusBarInsets.top,
                    statusBarInsets.right,
                    navBarInsets.bottom
                );
                return WindowInsetsCompat.CONSUMED;
            });
        }

        // 2. Android 13+ OnBackPressedDispatcher for Back Gestures & Hardware Buttons
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "(function() { return (typeof window.onAndroidBack === 'function') ? window.onAndroidBack() : 'exit'; })();",
                        value -> {
                            if (value == null || value.contains("exit") || value.equals("\"exit\"")) {
                                moveTaskToBack(true);
                            }
                        }
                    );
                } else {
                    moveTaskToBack(true);
                }
            }
        });
    }
}
