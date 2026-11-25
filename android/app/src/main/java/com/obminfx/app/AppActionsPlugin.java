package com.obminfx.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Opens the Android share sheet, outside links, and tracks open JS overlays for system back handling. */
@CapacitorPlugin(name = "AppActions")
public class AppActionsPlugin extends Plugin {

    private static AppActionsPlugin instance;
    private static volatile boolean overlayOpen = false;

    @Override
    public void load() {
        instance = this;
        MainActivity.updateBackCallback(overlayOpen);
    }

    /** Tells native Android whether an in-app modal or scanner is currently open */
    @PluginMethod
    public void setOverlayOpen(PluginCall call) {
        overlayOpen = Boolean.TRUE.equals(call.getBoolean("open", false));
        MainActivity.updateBackCallback(overlayOpen);
        call.resolve();
    }

    static boolean isOverlayOpen() {
        return overlayOpen;
    }

    static void emitBackPress() {
        if (instance != null && instance.hasListeners("backPress")) {
            instance.notifyListeners("backPress", new JSObject());
        }
    }

    /** Shows the share sheet with plain text */
    @PluginMethod
    public void share(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.isEmpty()) {
            call.reject("No text to share");
            return;
        }
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, text);
        Intent chooser = Intent.createChooser(send, call.getString("title", null));
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No app can share text");
        }
    }

    /** Opens a link in the app that handles it; tries `fallback` when nothing handles `url` */
    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        String fallback = call.getString("fallback");
        if (url == null || !(url.startsWith("https:") || url.startsWith("market:"))) {
            call.reject("Unsupported link");
            return;
        }
        if (open(url) || (fallback != null && fallback.startsWith("https:") && open(fallback))) {
            call.resolve();
        } else {
            call.reject("No app can open this link");
        }
    }

    private boolean open(String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getActivity().startActivity(intent);
            return true;
        } catch (ActivityNotFoundException e) {
            return false;
        }
    }
}
