package com.cuadernodelartista.crochet;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final int REQ_AUDIO_PERMISSION = 5280;
    private PermissionRequest pendingWebPermissionRequest = null;

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

            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);

            // Grant WebView microphone capture cleanly for Cover Turntable voice notes
            webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        boolean needsAudio = false;
                        for (String res : request.getResources()) {
                            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                                needsAudio = true;
                                break;
                            }
                        }
                        if (needsAudio && ContextCompat.checkSelfPermission(
                                MainActivity.this,
                                Manifest.permission.RECORD_AUDIO
                        ) != PackageManager.PERMISSION_GRANTED) {
                            pendingWebPermissionRequest = request;
                            ActivityCompat.requestPermissions(
                                    MainActivity.this,
                                    new String[]{Manifest.permission.RECORD_AUDIO},
                                    REQ_AUDIO_PERMISSION
                            );
                        } else {
                            request.grant(request.getResources());
                        }
                    });
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO_PERMISSION && pendingWebPermissionRequest != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
            } else {
                pendingWebPermissionRequest.deny();
            }
            pendingWebPermissionRequest = null;
        }
    }
}
