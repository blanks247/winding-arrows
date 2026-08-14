package com.windingarrows.puzzleescape;

import android.os.Bundle;
import android.webkit.ValueCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
