package com.obminfx.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Opens the Android share sheet and outside links (Play Store, email) for the web app. */
@CapacitorPlugin(name = "AppActions")
public class AppActionsPlugin extends Plugin {

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
        if (url == null || !(url.startsWith("https:") || url.startsWith("market:") || url.startsWith("mailto:"))) {
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
