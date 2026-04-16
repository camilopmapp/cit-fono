// src/modules/callDetector.js
// Wrapper JS del módulo nativo Android de detección de llamadas
// Cruza el número entrante con la base de datos para identificar al residente

import { NativeModules, NativeEventEmitter } from 'react-native'
import { DB } from '../db/database'
import logger from '../utils/logger'

const { CallDetector } = NativeModules

// Verificar que el módulo nativo esté disponible
if (!CallDetector) {
  logger.warn('[CallDetector] Módulo nativo no disponible — ¿compilaste el APK?')
}

const emitter = CallDetector ? new NativeEventEmitter(CallDetector) : null

// ── Buscar residente por número en la BD ─────────────────────────
export async function buscarPorNumero(numero) {
  if (!numero || numero === 'desconocido') return null

  // Normalizar número: quitar espacios, guiones, paréntesis
  const limpio = numero.replace(/[\s\-\(\)\+]/g, '')

  // Buscar en todos los teléfonos registrados
  try {
    // Buscar por los últimos 10 dígitos (ignora código de país)
    const sufijo = limpio.slice(-10)
    const res = await Promise.race([
      DB.buscarTelefonoPorNumero(sufijo),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])
    return res || null
  } catch (e) {
    return null
  }
}

// ── Iniciar escucha de llamadas ───────────────────────────────────
export function iniciarDeteccion({
  onEntrante,    // ({numero, residente}) => void
  onContestada,  // () => void
  onTerminada,   // () => void
}) {
  if (!CallDetector || !emitter) {
    logger.warn('[CallDetector] No disponible')
    return () => {}
  }

  CallDetector.startListening()

  // Llamada entrante — buscar en BD quién es
  const subEntrante = emitter.addListener('CallIncoming', async (numero) => {
    logger.log('[CallDetector] Entrante:', numero)
    const residente = await buscarPorNumero(numero)
    onEntrante({ numero, residente })
  })

  // Llamada contestada
  const subContestada = emitter.addListener('CallAnswered', () => {
    logger.log('[CallDetector] Contestada')
    onContestada?.()
  })

  // Llamada terminada
  const subTerminada = emitter.addListener('CallEnded', () => {
    logger.log('[CallDetector] Terminada')
    onTerminada?.()
  })

  return () => {
    subEntrante.remove()
    subContestada.remove()
    subTerminada.remove()
    CallDetector.stopListening()
  }
}

// ── Funciones de Modo Kiosko ───────────────────────────────────────

export function activarModoKiosko() {
  if (CallDetector?.startKioskMode) {
    CallDetector.startKioskMode()
    logger.log('[Kiosko] Activado')
  }
}

export function desactivarModoKiosko() {
  if (CallDetector?.stopKioskMode) {
    CallDetector.stopKioskMode()
    logger.log('[Kiosko] Desactivado')
  }
}

export async function estaEnModoKiosko() {
  if (CallDetector?.isInKioskMode) {
    return await CallDetector.isInKioskMode()
  }
  return false
}
