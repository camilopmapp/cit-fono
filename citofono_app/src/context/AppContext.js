// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DARK, LIGHT } from '../theme'
import { DB } from '../db/database'
import { iniciarDeteccion, activarModoKiosko, desactivarModoKiosko } from '../modules/callDetector'
import * as navigation from '../navigation/navigationService'
import logger from '../utils/logger'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [theme,      setTheme]      = useState(DARK)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [config,     setConfig]     = useState({
    nombre_conjunto: 'Conjunto Residencial',
    admin_pin:       '000000',
    theme_mode:      'dark',
  })
  const [dbReady,    setDbReady]    = useState(false)
  const [llamandoA,  setLlamandoA]  = useState(null) // apto actual en llamada

  // Inicializar DB, cargar config y activar listeners globales
  useEffect(() => {
    async function init() {
      await DB.init()
      setDbReady(true)
      const cfg = await DB.getConfig()
      setConfig(cfg)
      setTheme(cfg.theme_mode === 'light' ? LIGHT : DARK)

      // Iniciar detección de llamadas global
      const cleanup = iniciarDeteccion({
        onEntrante: async ({ numero, residente }) => {
          logger.log('[GlobalDetector] Llamada entrante:', numero)
          if (residente) {
            await DB.insertHistorial({
              torre:       residente.torre_nombre,
              numero_apto: residente.apto_numero,
              residente:   residente.residente || '',
              tel_llamado: numero,
              nombre_tel:  residente.tel_nombre || '',
              atendida:    false,
              duracion_seg: 0,
              tipo_llamada: 'entrante_perdida'
            })
          }
          // Navegación global
          navigation.navigate('LlamadaEntrante', { numero, residente })
        },
        onContestada: () => logger.log('[GlobalDetector] Contestada'),
        onTerminada: () => logger.log('[GlobalDetector] Terminada'),
      })

      // Activar Kiosko si está configurado (por defecto en esta versión)
      if (cfg.kiosk_mode !== 'false') {
        activarModoKiosko()
      }

      return cleanup
    }
    const cleanupPromise = init()
    return () => { cleanupPromise.then(cleanup => cleanup && cleanup()) }
  }, [])

  // Cambiar tema
  const toggleTheme = useCallback(async (mode) => {
    const t = mode === 'light' ? LIGHT : DARK
    setTheme(t)
    await DB.setConfig('theme_mode', mode)
    setConfig(prev => ({ ...prev, theme_mode: mode }))
  }, [])

  // Login admin
  const loginAdmin = useCallback(async (pin) => {
    const cfg = await DB.getConfig()
    if (pin === cfg.admin_pin) {
      setIsAdmin(true)
      return true
    }
    return false
  }, [])

  const logoutAdmin = useCallback(() => setIsAdmin(false), [])

  // Actualizar config
  const updateConfig = useCallback(async (key, value) => {
    await DB.setConfig(key, value)
    setConfig(prev => ({ ...prev, [key]: value }))
    if (key === 'theme_mode') toggleTheme(value)
  }, [toggleTheme])

  return (
    <AppContext.Provider value={{
      theme, isAdmin, config, dbReady,
      llamandoA, setLlamandoA,
      loginAdmin, logoutAdmin,
      updateConfig, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
