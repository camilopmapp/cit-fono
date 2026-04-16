# 🔔 Citofonía App — React Native

Aplicación de citofonía digital para conjuntos residenciales colombianos.
Convierte cualquier celular Android en un sistema de citofonía completo.

---

## Requisitos del celular

- Android 8.0 o superior
- SIM card con plan de voz activo
- Mínimo 2GB RAM
- Pantalla mínimo 5.5"
- Recomendado: tablet 8-10" para mejor experiencia

---

## Instalación del entorno de desarrollo

### 1. Instalar dependencias base
```bash
# Node.js 18+ requerido
node --version

# React Native CLI
npm install -g react-native-cli

# Java JDK 17
# Descargar desde: https://adoptium.net

# Android Studio
# Descargar desde: https://developer.android.com/studio
```

### 2. Variables de entorno (agregar a ~/.bashrc o ~/.zshrc)
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Instalar dependencias del proyecto
```bash
cd citofono_app
npm install

# iOS (solo macOS)
cd ios && pod install && cd ..
```

---

## Ejecutar en desarrollo

```bash
# Iniciar Metro bundler
npx react-native start

# Instalar en Android (con celular conectado o emulador)
npx react-native run-android

# Ver logs
npx react-native log-android
```

---

## Generar APK para producción

```bash
cd android

# Generar keystore (solo la primera vez)
keytool -genkey -v -keystore citofonia.keystore \
  -alias citofonia -keyalg RSA -keysize 2048 -validity 10000

# Agregar al archivo android/gradle.properties:
MYAPP_RELEASE_STORE_FILE=citofonia.keystore
MYAPP_RELEASE_KEY_ALIAS=citofonia
MYAPP_RELEASE_STORE_PASSWORD=TU_PASSWORD
MYAPP_RELEASE_KEY_PASSWORD=TU_PASSWORD

# Compilar APK release
./gradlew assembleRelease

# APK generado en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Instalar APK en el celular de portería

```bash
# Con celular conectado por USB
adb install android/app/build/outputs/apk/release/app-release.apk

# O copiar el APK al celular y abrirlo desde el explorador de archivos
# (Habilitar "Fuentes desconocidas" en Configuración → Seguridad)
```

---

## Modo kiosko (pantalla bloqueada para el portero)

### Nivel 1 — Básico (incluido en el código)
- Botón de regreso bloqueado en modo portero
- Pantalla siempre encendida (KeepAwake)
- App arranca sola al encender el celular (BootReceiver)

### Nivel 2 — Completo (requiere configuración adicional)

Para bloqueo total (el portero NO puede salir a otras apps):

```bash
# 1. Instalar la app en el celular
adb install app-release.apk

# 2. Configurar como Device Owner (UNA SOLA VEZ, con celular recién reseteado)
adb shell dpm set-device-owner com.citofoniaapp/.AdminReceiver

# 3. La app activará Lock Task Mode automáticamente
#    El portero no podrá cambiar de app, bajar notificaciones, ni apagar el celular
```

**Alternativa sin root:** Usar la app **"Fully Kiosk Browser"** como launcher
y configurar la URL `file:///` apuntando al APK. Es la opción más simple para
deployments rápidos.

### Nivel 3 — MDM (para múltiples conjuntos)
Usar **Android Enterprise** con Google Workspace o
**Samsung Knox** si los celulares son Samsung.

---

## Estructura del proyecto

```
citofono_app/
├── App.js                          ← Entrada principal + modo kiosko
├── src/
│   ├── context/AppContext.js       ← Estado global (tema, auth, config)
│   ├── db/database.js             ← SQLite: toda la lógica de datos
│   ├── theme/index.js             ← Colores claro/oscuro + tokens
│   ├── navigation/index.js        ← Navegación (Stack + Tabs)
│   ├── components/common/index.js ← Componentes reutilizables
│   └── screens/
│       ├── portero/
│       │   ├── TorresScreen.js    ← Pantalla principal (torres)
│       │   ├── ApartamentosScreen.js
│       │   ├── LlamarScreen.js    ← Llamada con múltiples teléfonos
│       │   └── BuscarAptoScreen.js
│       └── admin/
│           ├── AdminLoginScreen.js ← PIN numérico 6 dígitos
│           ├── DashboardScreen.js  ← KPIs + últimas llamadas
│           ├── ResidentesScreen.js ← CRUD completo de apartamentos
│           ├── TorresAdminScreen.js
│           ├── ImportarScreen.js   ← Importar desde Excel
│           ├── HistorialScreen.js  ← Historial con filtros + CSV
│           └── ConfigScreen.js    ← Nombre, PIN, tema
├── android/
│   ├── AndroidManifest.xml        ← Permisos + kiosko
│   └── BootReceiver.java          ← Auto-arranque al encender
└── plantilla_importacion.csv      ← Plantilla Excel para importar
```

---

## Formato Excel para importar residentes

| Columna | Requerido | Ejemplo |
|---|---|---|
| Torre | ✅ | Torre A |
| Apartamento | ✅ | 403 |
| Piso | No | 4 |
| Nombre Residente | No | García Ruiz |
| Teléfono 1 | ✅ | 3001234567 |
| Nombre Tel 1 | No | Mamá |
| Teléfono 2 | No | 3109876543 |
| Nombre Tel 2 | No | Papá |
| Teléfono 3 | No | 3205554433 |
| Nombre Tel 3 | No | Oficina |

- La primera fila debe ser el encabezado
- Los teléfonos con o sin +57
- Si el apartamento ya existe, se actualiza (modo merge)

---

## Cómo acceder al modo administrador

1. En la pantalla de torres, tocar el título del conjunto **6 veces seguidas**
2. Ingresar el PIN de 6 dígitos (por defecto: **000000**)
3. Cambiar el PIN inmediatamente desde Config → Seguridad

---

## Cómo funciona la llamada con múltiples teléfonos

```
Portero toca el apartamento
         ↓
App llama al Teléfono 1 (ej: Mamá)
         ↓ 25 segundos sin respuesta
App llama automáticamente al Teléfono 2 (ej: Papá)
         ↓ 20 segundos sin respuesta
App llama al Teléfono 3 si existe
         ↓ Sin respuesta en ninguno
Muestra "Sin respuesta" y registra en historial
```

El portero también puede marcar manualmente "Atendida" si el residente
confirmó verbalmente pero el sistema no lo detectó automáticamente.

---

## Exportar historial

En modo admin → Historial → botón "⬇ CSV"
El archivo se guarda en la carpeta **Descargas** del celular.

---

## Librerías principales

| Librería | Uso |
|---|---|
| `react-native-sqlite-storage` | Base de datos local SQLite |
| `react-native-document-picker` | Seleccionar archivos Excel |
| `react-native-fs` | Leer/escribir archivos |
| `xlsx` | Parsear archivos Excel |
| `react-native-phone-call` | Realizar llamadas GSM |
| `react-native-keep-awake` | Pantalla siempre encendida |
| `@react-navigation/native` | Navegación entre pantallas |
| `date-fns` | Formateo de fechas |

---

## Soporte

Para conjuntos residenciales en Popayán, Cauca, Colombia.
Desarrollado con React Native 0.73 + SQLite local.
Sin dependencia de internet para el funcionamiento básico.
