// android/app/src/main/java/com/citofoniaapp/MainActivity.java
package com.citofoniaapp;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Bundle;
import android.view.WindowManager;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Pantalla siempre encendida — nunca se apaga mientras la app está activa
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Mostrar sobre la pantalla de bloqueo (útil si el celular se bloquea)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);

        // Activar Lock Task Mode si el dispositivo es Device Owner
        // Esto bloquea la app en pantalla completa — el portero no puede salir
        try {
            ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null && am.isInLockTaskMode() == false) {
                startLockTask();
            }
        } catch (Exception e) {
            // Si no es Device Owner, continúa sin modo kiosko completo
            // El bloqueo básico del botón de regreso sigue funcionando desde JS
        }
    }

    @Override
    protected String getMainComponentName() {
        return "CitofoniaApp";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }

    // Salir de Lock Task Mode (llamado desde JS cuando admin hace logout)
    public void stopKioskMode() {
        try {
            stopLockTask();
        } catch (Exception e) {
            // Ignorar si no estaba en modo kiosko
        }
    }
}
