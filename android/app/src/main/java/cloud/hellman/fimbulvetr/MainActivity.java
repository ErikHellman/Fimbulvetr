package cloud.hellman.fimbulvetr;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.IOException;
import java.io.InputStream;

/**
 * The whole app: a full-screen WebView running the web build from the APK's assets. The pages are served
 * from https://appassets.androidplatform.net (Android's reserved host for app assets), so the game gets a
 * secure origin and with it IndexedDB saves, Web Locks and module workers, exactly as on the web.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";

    private final PadBridge pad = new PadBridge();
    private WebView web;

    /** What the game sees as `window.FimbulvetrHost`. Called on a WebView thread. */
    final class Host {
        @JavascriptInterface
        public String platform() {
            return "androidtv";
        }

        @JavascriptInterface
        public String pad() {
            return pad.state();
        }

        @JavascriptInterface
        public void exit() {
            runOnUiThread(MainActivity.this::finish);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xff000000);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        web.addJavascriptInterface(new Host(), "FimbulvetrHost");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return asset(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                // Stay on the game; nothing in it links out.
                return !HOST.equals(req.getUrl().getHost());
            }
        });
        setContentView(web);
        web.requestFocus();
        hideSystemUi();
        web.loadUrl(START);
    }

    /** Serves `assets/web/<path>` for the app's own host; anything else goes to the network as usual. */
    private WebResourceResponse asset(Uri url) {
        if (!HOST.equals(url.getHost())) return null;
        String path = url.getPath();
        if (path == null || path.equals("/")) path = "/index.html";
        try {
            InputStream in = getAssets().open("web" + path);
            return new WebResourceResponse(mime(path), mime(path).startsWith("text/") ? "utf-8" : null, in);
        } catch (IOException e) {
            WebResourceResponse missing = new WebResourceResponse("text/plain", "utf-8", null);
            missing.setStatusCodeAndReasonPhrase(404, "Not Found");
            return missing;
        }
    }

    static String mime(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        // Back: Escape (cancel in every menu) for the page, and Start held, so it also opens and closes
        // the pause menu in play. The game exits itself from the title screen.
        if (code == KeyEvent.KEYCODE_BACK || code == KeyEvent.KEYCODE_ESCAPE) {
            boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
            pad.hold(PadBridge.START, down);
            if (code == KeyEvent.KEYCODE_BACK) {
                web.dispatchKeyEvent(new KeyEvent(e.getDownTime(), e.getEventTime(), e.getAction(),
                        KeyEvent.KEYCODE_ESCAPE, e.getRepeatCount()));
                return true;
            }
            return super.dispatchKeyEvent(e);
        }
        if (PadBridge.fromPad(e.getSource()) && pad.key(e)) return true;
        // The remote's centre button: Enter (confirm) for the page.
        if (code == KeyEvent.KEYCODE_DPAD_CENTER) {
            web.dispatchKeyEvent(new KeyEvent(e.getDownTime(), e.getEventTime(), e.getAction(),
                    KeyEvent.KEYCODE_ENTER, e.getRepeatCount()));
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent e) {
        if (PadBridge.fromPad(e.getSource()) && e.getAction() == MotionEvent.ACTION_MOVE) {
            pad.motion(e);
            return true;
        }
        return super.dispatchGenericMotionEvent(e);
    }

    @SuppressWarnings("deprecation")
    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) hideSystemUi();
        else pad.clear();
    }

    @Override
    protected void onPause() {
        pad.clear();
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
