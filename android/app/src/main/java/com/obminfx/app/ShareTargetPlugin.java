package com.obminfx.app;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Receives text shared to ObminFX (a bank notification or SMS) and hands it to the web app.
 * Text that arrives before the web app is ready waits until the app asks for it with getSharedText().
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    private static final int MAX_LENGTH = 2000;
    private static String pendingText;
    private static ShareTargetPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    /** Called by MainActivity for the launch intent and for every new intent */
    static void receive(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return;
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (text == null || text.length() == 0) return;
        String value = text.toString();
        pendingText = value.length() > MAX_LENGTH ? value.substring(0, MAX_LENGTH) : value;
        // Each shared text is handled once, also after the activity is recreated
        intent.setAction(Intent.ACTION_MAIN);
        if (instance != null) instance.deliver();
    }

    private void deliver() {
        if (pendingText == null || !hasListeners("sharedText")) return;
        JSObject data = new JSObject();
        data.put("text", pendingText);
        pendingText = null;
        notifyListeners("sharedText", data);
    }

    /** Text shared while the app was starting, or null */
    @PluginMethod
    public void getSharedText(PluginCall call) {
        JSObject result = new JSObject();
        result.put("text", pendingText);
        pendingText = null;
        call.resolve(result);
    }
}
