// src/utils/permissions.js
// Solicitar todos los permisos necesarios al primer arranque
import { PermissionsAndroid, Platform, Alert } from 'react-native'

export async function solicitarPermisos() {
  if (Platform.OS !== 'android') return true

  try {
    const permisos = [
      PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]

    const resultado = await PermissionsAndroid.requestMultiple(permisos)

    const callPhoneOk = resultado[PermissionsAndroid.PERMISSIONS.CALL_PHONE]
      === PermissionsAndroid.RESULTS.GRANTED
    const phoneStateOk = resultado[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE]
      === PermissionsAndroid.RESULTS.GRANTED

    if (!callPhoneOk) {
      Alert.alert(
        '⚠️ Permiso requerido',
        'La aplicación necesita permiso para realizar llamadas. ' +
        'Por favor, ve a Configuración → Apps → Citofonía → Permisos y activa "Teléfono".',
        [{ text: 'Entendido' }]
      )
      return false
    }

    if (!phoneStateOk) {
      Alert.alert(
        '⚠️ Permiso recomendado',
        'Para identificar quien llama (citofono bidireccional), ' +
        'la app necesita acceso al estado del teléfono.',
        [{ text: 'Entendido' }]
      )
    }

    return true
  } catch (e) {
    console.warn('[Permisos] Error:', e)
    return false
  }
}

export async function verificarPermisoLlamadas() {
  if (Platform.OS !== 'android') return true
  const result = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CALL_PHONE
  )
  return result
}

export async function verificarPermisoEstadoTelefono() {
  if (Platform.OS !== 'android') return true
  const result = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
  )
  return result
}
