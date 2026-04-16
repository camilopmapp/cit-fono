// android/app/src/main/java/com/citofoniaapp/CallDetectorModule.java
// Módulo nativo Android para detectar llamadas entrantes
// y obtener el número antes de que Android muestre su pantalla
package com.citofoniaapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.telephony.TelephonyManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class CallDetectorModule extends ReactContextBaseJavaModule {

    private ReactApplicationContext reactContext;
    private BroadcastReceiver callReceiver;
    private String lastState = "";

    public CallDetectorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CallDetector";
    }

    // Enviar evento a JavaScript
    private void sendEvent(String eventName, String data) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, data);
    }

    @ReactMethod
    public void startListening() {
        callReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                String number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);

                if (state == null) return;

                // Evitar eventos duplicados
                if (state.equals(lastState)) return;
                lastState = state;

                if (state.equals(TelephonyManager.EXTRA_STATE_RINGING)) {
                    // Llamada entrante — enviar número a JS
                    String num = (number != null) ? number : "desconocido";
                    sendEvent("CallIncoming", num);

                } else if (state.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)) {
                    // Llamada contestada
                    sendEvent("CallAnswered", number != null ? number : "");

                } else if (state.equals(TelephonyManager.EXTRA_STATE_IDLE)) {
                    // Llamada terminada o rechazada
                    sendEvent("CallEnded", "");
                    lastState = "";
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
        reactContext.registerReceiver(callReceiver, filter);
    }

    @ReactMethod
    public void stopListening() {
        if (callReceiver != null) {
            try {
                reactContext.unregisterReceiver(callReceiver);
                callReceiver = null;
            } catch (Exception e) {
                // Ignorar si ya estaba desregistrado
            }
        }
    }

    // Necesario para React Native 0.65+
    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}

    // ── Control de Modo Kiosko ───────────────────────────────────────

    @ReactMethod
    public void startKioskMode() {
        android.app.Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.startLockTask();
                    } catch (Exception e) {
                        // Puede fallar si no es Device Owner
                    }
                }
            });
        }
    }

    @ReactMethod
    public void stopKioskMode() {
        android.app.Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        activity.stopLockTask();
                    } catch (Exception e) {
                        // Ignorar si no estaba en modo kiosko
                    }
                }
            });
        }
    }

    @ReactMethod
    public void isInKioskMode(com.facebook.react.bridge.Promise promise) {
        android.app.Activity activity = getCurrentActivity();
        if (activity != null) {
            android.app.ActivityManager am = (android.app.ActivityManager) 
                activity.getSystemService(Context.ACTIVITY_SERVICE);
            promise.resolve(am.isInLockTaskMode());
        } else {
            promise.resolve(false);
        }
    }
}
