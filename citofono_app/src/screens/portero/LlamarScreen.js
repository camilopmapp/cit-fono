// src/screens/portero/LlamarScreen.js — v2
// Muestra notas del residente, llama a múltiples teléfonos en orden,
// registra en historial como 'saliente'
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StatusBar,
  Animated, Alert, Vibration, ScrollView,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import { BtnPrimary, BtnDanger, BtnSecondary, Card } from '../../components/common'

const TIMEOUT_TEL1 = 25
const TIMEOUT_RESTO = 20

export default function LlamarScreen({ route, navigation }) {
  const { apto: aptoBasico } = route.params
  const { theme } = useApp()

  const [apto,      setApto]      = useState(null)
  const [telefonos, setTelefonos] = useState([])
  const [telIndex,  setTelIndex]  = useState(0)
  const [estado,    setEstado]    = useState('cargando')
  const [segundos,  setSegundos]  = useState(TIMEOUT_TEL1)
  const [callStart, setCallStart] = useState(null)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const timerRef  = useRef(null)

  useEffect(() => {
    cargarApto()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function cargarApto() {
    const data = await DB.getApartamento(aptoBasico.id)
    setApto(data)
    setTelefonos(data?.telefonos || [])
    setEstado('listo')
  }

  useEffect(() => {
    if (estado === 'llamando') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [estado])

  function iniciarTimer(timeout, onTimeout) {
    setSegundos(timeout)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSegundos(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function llamar(index = 0) {
    if (!telefonos[index]) {
      // Agotamos todos
      await DB.insertHistorial({
        torre:       apto.torre_nombre,
        numero_apto: apto.numero,
        residente:   apto.residente,
        tel_llamado: '',
        nombre_tel:  '',
        atendida:    false,
        duracion_seg: 0,
        tipo_llamada: 'saliente',
      })
      setEstado('noResponde')
      return
    }

    const tel = telefonos[index]
    setTelIndex(index)
    setEstado('llamando')
    setCallStart(Date.now())
    Vibration.vibrate(80)

    try {
      const phoneCall = require('react-native-phone-call').default
      await phoneCall({ number: tel.numero.replace(/\D/g, ''), prompt: false })
    } catch (e) {
      console.log('[Llamar] Error:', e)
    }

    const timeout = index === 0 ? TIMEOUT_TEL1 : TIMEOUT_RESTO
    iniciarTimer(timeout, async () => {
      const next = index + 1
      if (next < telefonos.length) {
        setEstado('pasando')
        setTimeout(() => llamar(next), 1200)
      } else {
        await DB.insertHistorial({
          torre:       apto.torre_nombre,
          numero_apto: apto.numero,
          residente:   apto.residente,
          tel_llamado: tel.numero,
          nombre_tel:  tel.nombre,
          atendida:    false,
          duracion_seg: timeout,
          tipo_llamada: 'saliente',
        })
        setEstado('noResponde')
      }
    })
  }

  function cancelar() {
    if (timerRef.current) clearInterval(timerRef.current)
    setEstado('listo')
    setTelIndex(0)
    setSegundos(TIMEOUT_TEL1)
  }

  async function marcarAtendida() {
    if (timerRef.current) clearInterval(timerRef.current)
    const duracion = callStart ? Math.round((Date.now() - callStart) / 1000) : 0
    const tel = telefonos[telIndex]
    await DB.insertHistorial({
      torre:       apto.torre_nombre,
      numero_apto: apto.numero,
      residente:   apto.residente,
      tel_llamado: tel?.numero || '',
      nombre_tel:  tel?.nombre || '',
      atendida:    true,
      duracion_seg: duracion,
      tipo_llamada: 'saliente',
    })
    Alert.alert('✅ Registrado', 'La visita fue atendida.')
    navigation.goBack()
  }

  if (!apto) return (
    <View style={{ flex:1, backgroundColor: theme.bg,
                   alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color: theme.textHint }}>Cargando...</Text>
    </View>
  )

  const telActual = telefonos[telIndex]

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg}/>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

        {/* ── Info apartamento ── */}
        <View style={{
          backgroundColor: theme.surface,
          padding: SPACING.xl,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 4,
          }}>{apto.torre_nombre}</Text>

          <Text style={{
            fontSize: 72, fontWeight: FONT.bold, // Más grande para tablet
            color: theme.accent, lineHeight: 82,
          }}>{apto.numero}</Text>

          <Text style={{
            fontSize: FONT.xxl, fontWeight: FONT.bold, // xxl en tablet
            color: theme.text, marginTop: 4,
          }}>
            {apto.residente || `Apartamento ${apto.numero}`}
          </Text>

          <Text style={{
            fontSize: FONT.sm, color: theme.textHint, marginTop: 2,
          }}>
            Piso {apto.piso}
          </Text>

          {apto.dnd && (
            <View style={{
              backgroundColor: theme.redBg,
              borderRadius: RADIUS.full,
              paddingHorizontal: SPACING.md,
              paddingVertical: 4,
              marginTop: SPACING.sm,
              borderWidth: 1,
              borderColor: theme.red + '40',
            }}>
              <Text style={{ color: theme.red, fontSize: FONT.sm }}>
                🔇 No molestar: {apto.dnd_inicio} – {apto.dnd_fin}
              </Text>
            </View>
          )}

          {/* Notas del residente */}
          {apto.nota ? (
            <View style={{
              backgroundColor: theme.amberBg,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              marginTop: SPACING.md,
              width: '100%',
              borderWidth: 1,
              borderColor: theme.amber + '40',
            }}>
              <Text style={{
                fontSize: FONT.xs, color: theme.amber,
                fontFamily: 'monospace', fontWeight: FONT.semibold,
                marginBottom: 4,
              }}>📝 NOTA DEL PORTERO</Text>
              <Text style={{
                fontSize: FONT.sm, color: theme.amber,
                lineHeight: FONT.sm * 1.5,
              }}>{apto.nota}</Text>
            </View>
          ) : null}

          {/* Botón de notas */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Notas', { apto })}
            style={{ marginTop: SPACING.sm }}
          >
            <Text style={{ color: theme.textHint, fontSize: FONT.sm }}>
              {apto.nota ? '✏️ Editar nota' : '📝 Agregar nota'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista de teléfonos ── */}
        <View style={{ padding: SPACING.md }}>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: SPACING.sm,
          }}>Teléfonos registrados</Text>

          {telefonos.map((tel, idx) => {
            const esActual     = estado === 'llamando' && idx === telIndex
            const esPasando    = estado === 'pasando'  && idx === telIndex
            const yaIntentado  = idx < telIndex
            return (
              <View key={tel.id || idx} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: esActual ? theme.accentBg : theme.surface,
                borderRadius: RADIUS.lg,
                padding: SPACING.md,
                marginBottom: SPACING.sm,
                borderWidth: 2,
                borderColor: esActual ? theme.accent
                           : esPasando ? theme.amber
                           : yaIntentado ? theme.border + '50'
                           : theme.border,
                opacity: yaIntentado ? 0.5 : 1,
              }}>
                <Text style={{ fontSize: 20, marginRight: SPACING.md }}>
                  {esActual    ? '📞'
                   : esPasando ? '⏳'
                   : yaIntentado ? '✗'
                   : `${idx + 1}`}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: FONT.md, fontWeight: FONT.semibold,
                    color: esActual ? theme.accent : theme.text,
                  }}>{tel.nombre}</Text>
                  <Text style={{
                    fontSize: FONT.sm, color: theme.textHint,
                    fontFamily: 'monospace',
                  }}>{tel.numero}</Text>
                </View>
                {esActual && (
                  <Text style={{
                    fontSize: FONT.xxl, fontWeight: FONT.bold,
                    color: segundos <= 5 ? theme.red : theme.accent,
                    fontFamily: 'monospace',
                    minWidth: 44, textAlign: 'right',
                  }}>{segundos}s</Text>
                )}
              </View>
            )
          })}
        </View>

        {/* ── Controles ── */}
        <View style={{ padding: SPACING.md, paddingBottom: SPACING.xl }}>

          {estado === 'listo' && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={() => llamar(0)}
                style={{
                  backgroundColor: theme.green,
                  borderRadius: RADIUS.full,
                  height: 76,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: SPACING.sm,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 32 }}>📞</Text>
                <Text style={{
                  fontSize: FONT.xxl, fontWeight: FONT.bold, color: '#000',
                }}>Llamar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {(estado === 'llamando' || estado === 'pasando') && (
            <View style={{ gap: SPACING.sm }}>
              {estado === 'pasando' && (
                <View style={{
                  backgroundColor: theme.amberBg,
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: theme.amber, fontSize: FONT.md }}>
                    ⏳ Pasando al siguiente teléfono...
                  </Text>
                </View>
              )}
              <BtnSecondary
                label="✅ Marcar como atendida"
                onPress={marcarAtendida}
                theme={theme}
              />
              <BtnDanger
                label="❌ Cancelar"
                onPress={cancelar}
                theme={theme}
              />
            </View>
          )}

          {estado === 'noResponde' && (
            <>
              <View style={{
                backgroundColor: theme.redBg,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.red + '40',
              }}>
                <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>📵</Text>
                <Text style={{
                  fontSize: FONT.lg, fontWeight: FONT.bold,
                  color: theme.red, textAlign: 'center',
                }}>Sin respuesta</Text>
                <Text style={{
                  fontSize: FONT.sm, color: theme.textHint,
                  textAlign: 'center', marginTop: 4,
                }}>
                  Se intentaron {telefonos.length} teléfono{telefonos.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <BtnSecondary
                label="↩ Intentar de nuevo"
                onPress={() => { setTelIndex(0); setEstado('listo') }}
                theme={theme}
              />
            </>
          )}

          {(estado === 'noResponde' || estado === 'listo') && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                alignItems: 'center', padding: SPACING.md, marginTop: SPACING.sm,
              }}
            >
              <Text style={{ color: theme.textHint, fontSize: FONT.md }}>
                ← Volver a la lista
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
