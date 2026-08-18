package com.windingarrows.puzzleescape;

import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Android 13+ OnBackPressedDispatcher for Back Gestures & Buttons
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "(function() { return (typeof window.onAndroidBack === 'function') ? window.onAndroidBack() : 'exit'; })();",
                        new ValueCallback<String>() {
                            @Override
                            public void onReceiveValue(String value) {
                                if (value == null || value.contains("exit") || value.equals("\"exit\"")) {
                                    moveTaskToBack(true);
                                }
                            }
                        }
                    );
                } else {
                    moveTaskToBack(true);
                }
            }
        });

        // 2. Inject exact System Window Insets (Notch / Status Bar / Gesture Nav Bar) into WebView CSS variables
        View mainView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(mainView, (v, insets) -> {
            Insets statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout());
            Insets navBarInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());

            int topPx = statusBarInsets.top;
            int bottomPx = navBarInsets.bottom;

            if (bridge != null && bridge.getWebView() != null) {
                float density = getResources().getDisplayMetrics().density;
                int topDp = (int) (topPx / density);
                int bottomDp = (int) (bottomPx / density);

                String js = String.format(
                    "document.documentElement.style.setProperty('--status-bar-height', '%dpx');" +
                    "document.documentElement.style.setProperty('--nav-bar-height', '%dpx');",
                    Math.max(topDp, 36), Math.max(bottomDp, 24)
                );
                bridge.getWebView().evaluateJavascript(js, null);
            }
            return insets;
        });
    }

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(
                "(function() { return (typeof window.onAndroidBack === 'function') ? window.onAndroidBack() : 'exit'; })();",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (value == null || value.contains("exit") || value.equals("\"exit\"")) {
                            moveTaskToBack(true);
                        }
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
