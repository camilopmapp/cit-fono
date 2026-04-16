// src/screens/portero/LlamadaEntranteScreen.js
// Pantalla que aparece cuando entra una llamada
// Identifica automáticamente la torre, apto y nombre del residente

import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, Animated, TouchableOpacity,
  StatusBar, Vibration, Dimensions,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { SPACING, RADIUS, FONT } from '../../theme'

const { width } = Dimensions.get('window')

// Colores fijos para esta pantalla (no dependen del tema — es una alerta)
const CLR = {
  bg:        '#0a0f1a',
  surface:   '#111827',
  green:     '#4ade80',
  greenBg:   'rgba(74,222,128,0.15)',
  red:       '#f87171',
  redBg:     'rgba(248,113,113,0.15)',
  blue:      '#38bdf8',
  accent:    '#f97316',
  text:      '#e2e8f0',
  muted:     '#64748b',
}

export default function LlamadaEntranteScreen({ route, navigation }) {
  const { numero, residente } = route.params
  // residente puede ser null si es número desconocido
  const { theme } = useApp()

  const [duracion,   setDuracion]   = useState(0)
  const [contestada, setContestada] = useState(false)

  // Animaciones
  const pulseAnim  = useRef(new Animated.Value(1)).current
  const fadeAnim   = useRef(new Animated.Value(0)).current
  const slideAnim  = useRef(new Animated.Value(60)).current

  useEffect(() => {
    // Vibrar al entrar
    Vibration.vibrate([0, 400, 200, 400, 200, 400])

    // Fade in + slide up
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()

    // Pulso en los botones
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    )
    pulse.start()

    // Contador de duración
    const timer = setInterval(() => setDuracion(d => d + 1), 1000)

    return () => {
      clearInterval(timer)
      pulse.stop()
      Vibration.cancel()
    }
  }, [])

  function formatDuracion(seg) {
    const m = Math.floor(seg / 60)
    const s = seg % 60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  function handleTerminar() {
    navigation.goBack()
  }

  // ── Determinar si es conocido o desconocido ────────────────────
  const esConocido = !!residente

  return (
    <View style={{ flex: 1, backgroundColor: CLR.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={CLR.bg}/>

      <Animated.View style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>

        {/* ── ZONA SUPERIOR: Identificación ── */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
        }}>

          {/* Badge tipo llamada */}
          <View style={{
            backgroundColor: CLR.greenBg,
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xs,
            marginBottom: SPACING.xl,
            borderWidth: 1,
            borderColor: CLR.green + '60',
          }}>
            <Text style={{
              color: CLR.green, fontSize: FONT.sm,
              fontFamily: 'monospace', letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              📞 Llamada entrante
            </Text>
          </View>

          {/* Avatar / Ícono principal */}
          <Animated.View style={{
            transform: [{ scale: pulseAnim }],
            marginBottom: SPACING.xl,
          }}>
            {esConocido ? (
              // Residente identificado
              <View style={{
                width: 120, height: 120,
                borderRadius: 60,
                backgroundColor: CLR.accent + '20',
                borderWidth: 3,
                borderColor: CLR.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 52,
                  fontWeight: '800',
                  color: CLR.accent,
                }}>
                  {(residente.residente || residente.apto_numero || '?')
                    .charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              // Número desconocido
              <View style={{
                width: 120, height: 120,
                borderRadius: 60,
                backgroundColor: CLR.muted + '20',
                borderWidth: 3,
                borderColor: CLR.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 52 }}>❓</Text>
              </View>
            )}
          </Animated.View>

          {/* Nombre / Info del residente */}
          {esConocido ? (
            <View style={{ alignItems: 'center' }}>
              {/* Torre y Apto */}
              <View style={{
                flexDirection: 'row',
                gap: SPACING.sm,
                marginBottom: SPACING.sm,
              }}>
                <View style={{
                  backgroundColor: CLR.accent + '20',
                  borderRadius: RADIUS.full,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: CLR.accent + '60',
                }}>
                  <Text style={{
                    color: CLR.accent,
                    fontFamily: 'monospace',
                    fontSize: FONT.sm,
                    fontWeight: '700',
                  }}>🏢 {residente.torre_nombre}</Text>
                </View>
                <View style={{
                  backgroundColor: CLR.blue + '20',
                  borderRadius: RADIUS.full,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: CLR.blue + '60',
                }}>
                  <Text style={{
                    color: CLR.blue,
                    fontFamily: 'monospace',
                    fontSize: FONT.sm,
                    fontWeight: '700',
                  }}>🏠 Apto {residente.apto_numero}</Text>
                </View>
              </View>

              {/* Nombre del residente */}
              <Text style={{
                fontSize: FONT.xxxl,
                fontWeight: '800',
                color: CLR.text,
                textAlign: 'center',
                marginBottom: SPACING.xs,
              }}>
                {residente.residente || `Apto ${residente.apto_numero}`}
              </Text>

              {/* Nombre del teléfono que llama */}
              <Text style={{
                fontSize: FONT.lg,
                color: CLR.muted,
                marginBottom: SPACING.sm,
              }}>
                📱 {residente.tel_nombre}
              </Text>

              {/* Número */}
              <Text style={{
                fontSize: FONT.md,
                color: CLR.muted,
                fontFamily: 'monospace',
              }}>
                {numero}
              </Text>

              {/* Piso */}
              <Text style={{
                fontSize: FONT.sm,
                color: CLR.muted,
                marginTop: SPACING.xs,
                fontFamily: 'monospace',
              }}>
                Piso {residente.piso}
              </Text>
            </View>
          ) : (
            // Desconocido
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: FONT.xl,
                fontWeight: '700',
                color: CLR.muted,
                marginBottom: SPACING.sm,
              }}>
                Número desconocido
              </Text>
              <Text style={{
                fontSize: FONT.lg,
                color: CLR.text,
                fontFamily: 'monospace',
                marginBottom: SPACING.xs,
              }}>
                {numero}
              </Text>
              <Text style={{
                fontSize: FONT.sm,
                color: CLR.muted,
                textAlign: 'center',
              }}>
                No está registrado en el directorio
              </Text>
            </View>
          )}

          {/* Duración */}
          <Text style={{
            fontSize: FONT.xxl,
            fontWeight: '700',
            color: CLR.green,
            fontFamily: 'monospace',
            marginTop: SPACING.xl,
          }}>
            {formatDuracion(duracion)}
          </Text>

        </View>

        {/* ── ZONA INFERIOR: Acciones ── */}
        <View style={{
          padding: SPACING.xl,
          paddingBottom: SPACING.xl * 1.5,
          gap: SPACING.md,
        }}>

          {/* Si es desconocido: botón para agregar al directorio */}
          {!esConocido && (
            <TouchableOpacity
              onPress={() => navigation.navigate('NuevoResidenteRapido', {
                numero_prellenado: numero,
              })}
              style={{
                backgroundColor: CLR.blue + '20',
                borderRadius: RADIUS.lg,
                padding: SPACING.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: CLR.blue + '60',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: SPACING.sm,
              }}
            >
              <Text style={{ fontSize: 18 }}>➕</Text>
              <Text style={{
                color: CLR.blue,
                fontSize: FONT.md,
                fontWeight: '600',
              }}>Agregar al directorio</Text>
            </TouchableOpacity>
          )}

          {/* Botón terminar (rojo) */}
          <TouchableOpacity
            onPress={handleTerminar}
            style={{
              backgroundColor: CLR.red,
              borderRadius: RADIUS.full,
              height: 72,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: SPACING.sm,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>📵</Text>
            <Text style={{
              color: '#fff',
              fontSize: FONT.xl,
              fontWeight: '800',
            }}>Registrar y cerrar</Text>
          </TouchableOpacity>

          <Text style={{
            color: CLR.muted,
            fontSize: FONT.xs,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}>
            La llamada se contesta con los controles nativos del celular
          </Text>

        </View>
      </Animated.View>
    </View>
  )
}
