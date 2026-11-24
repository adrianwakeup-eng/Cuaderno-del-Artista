package com.cuadernodelartista.crochet;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Rich dark-wood AMOLED status & navigation bars for Samsung Galaxy Note 9
        Window window = getWindow();
        if (window != null) {
            int espressoBg = Color.parseColor("#1B1109");
            window.setStatusBarColor(espressoBg);
            window.setNavigationBarColor(espressoBg);
        }

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setBackgroundColor(Color.parseColor("#1B1109"));
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            // Optimize WebView for S Pen drawing, 528 Hz Web Audio & offline storage.
            // Capacitor's built-in BridgeWebChromeClient automatically handles RECORD_AUDIO & file pickers.
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
        }
    }
}
