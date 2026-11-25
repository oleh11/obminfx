package com.obminfx.app;

import android.content.Intent;
import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static MainActivity currentActivity;
    private OnBackPressedCallback backCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        currentActivity = this;
        registerPlugin(ShareTargetPlugin.class);
        registerPlugin(AppActionsPlugin.class);
        super.onCreate(savedInstanceState);

        backCallback = new OnBackPressedCallback(AppActionsPlugin.isOverlayOpen()) {
            @Override
            public void handleOnBackPressed() {
                AppActionsPlugin.emitBackPress();
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);

        ShareTargetPlugin.receive(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        ShareTargetPlugin.receive(intent);
    }

    @Override
    public void onDestroy() {
        if (currentActivity == this) {
            currentActivity = null;
        }
        super.onDestroy();
    }

    static void updateBackCallback(boolean enabled) {
        MainActivity activity = currentActivity;
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (activity.backCallback != null) {
                activity.backCallback.setEnabled(enabled);
            }
        });
    }
}
