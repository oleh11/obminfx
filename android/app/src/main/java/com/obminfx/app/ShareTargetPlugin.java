package com.obminfx.app;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Receives text shared to ObminFX (a bank notification or SMS) and launcher shortcut actions.
 * Data that arrives before the web app is ready waits until the app asks for it.
 */
@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {

    public static final String ACTION_SCAN = "com.obminfx.app.ACTION_SCAN";
    public static final String ACTION_CHECK_CARD = "com.obminfx.app.ACTION_CHECK_CARD";

    private static final int MAX_LENGTH = 2000;
    private static String pendingText;
    private static String pendingAction;
    private static ShareTargetPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    /** Called by MainActivity for the launch intent and for every new intent */
    static void receive(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (ACTION_SCAN.equals(action)) {
            pendingAction = "scan";
            intent.setAction(Intent.ACTION_MAIN);
            if (instance != null) instance.deliverAction();
            return;
        }
        if (ACTION_CHECK_CARD.equals(action)) {
            pendingAction = "check_card";
            intent.setAction(Intent.ACTION_MAIN);
            if (instance != null) instance.deliverAction();
            return;
        }
        if (!Intent.ACTION_SEND.equals(action)) return;
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

    private void deliverAction() {
        if (pendingAction == null || !hasListeners("launchAction")) return;
        JSObject data = new JSObject();
        data.put("action", pendingAction);
        pendingAction = null;
        notifyListeners("launchAction", data);
    }

    /** Text shared while the app was starting, or null */
    @PluginMethod
    public void getSharedText(PluginCall call) {
        JSObject result = new JSObject();
        result.put("text", pendingText);
        pendingText = null;
        call.resolve(result);
    }

    /** Launcher shortcut action received while starting, or null */
    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        JSObject result = new JSObject();
        result.put("action", pendingAction);
        pendingAction = null;
        call.resolve(result);
    }
}
