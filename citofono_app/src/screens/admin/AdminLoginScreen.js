// src/screens/admin/AdminLoginScreen.js
import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StatusBar, Vibration, Animated } from 'react-native'
import { useApp } from '../../context/AppContext'
import { SPACING, RADIUS, FONT } from '../../theme'

export default function AdminLoginScreen({ navigation }) {
  const { theme, loginAdmin, config } = useApp()
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState(false)
  const shakeAnim = useRef(new Animated.Value(0)).current

  const TECLAS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  async function handleTecla(t) {
    if (t === '') return
    if (t === '⌫') {
      setPin(prev => prev.slice(0, -1))
      setError(false)
      return
    }
    const newPin = pin + t
    setPin(newPin)
    if (newPin.length === 6) {
      const ok = await loginAdmin(newPin)
      if (ok) {
        navigation.replace('AdminMain')
      } else {
        setError(true)
        Vibration.vibrate(400)
        shake()
        setTimeout(() => { setPin(''); setError(false) }, 1000)
      }
    }
  }

  return (
    <View style={{
      flex: 1, backgroundColor: theme.bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg}/>

      <Text style={{
        fontSize: FONT.xxl, fontWeight: FONT.bold,
        color: theme.text, marginBottom: 4,
      }}>🔐 Administración</Text>
      <Text style={{
        fontSize: FONT.sm, color: theme.textHint,
        fontFamily: 'monospace', marginBottom: SPACING.xl * 2,
      }}>{config.nombre_conjunto}</Text>

      {/* Puntos PIN */}
      <Animated.View style={{
        flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl * 2,
        transform: [{ translateX: shakeAnim }],
      }}>
        {[0,1,2,3,4,5].map(i => (
          <View key={i} style={{
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: i < pin.length
              ? (error ? theme.red : theme.accent)
              : theme.surface3,
          }}/>
        ))}
      </Animated.View>

      {error && (
        <Text style={{
          color: theme.red, fontSize: FONT.md,
          marginBottom: SPACING.lg, fontWeight: FONT.semibold,
        }}>PIN incorrecto</Text>
      )}

      {/* Teclado numérico */}
      <View style={{ width: 280 }}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((fila, fi) => (
          <View key={fi} style={{
            flexDirection: 'row', justifyContent: 'space-between',
            marginBottom: SPACING.sm,
          }}>
            {fila.map((t, ti) => (
              <TouchableOpacity
                key={ti}
                onPress={() => handleTecla(t)}
                disabled={t === ''}
                style={{
                  width: 82, height: 82, borderRadius: 41,
                  backgroundColor: t === '' ? 'transparent'
                    : t === '⌫' ? theme.surface2
                    : theme.surface,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: t === '' ? 0 : 1,
                  borderColor: theme.border,
                }}
                activeOpacity={0.6}
              >
                <Text style={{
                  fontSize: t === '⌫' ? FONT.xl : FONT.xxl,
                  color: theme.text, fontWeight: FONT.medium,
                }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: SPACING.xl }}
      >
        <Text style={{ color: theme.textHint, fontSize: FONT.md }}>← Cancelar</Text>
      </TouchableOpacity>
    </View>
  )
}
