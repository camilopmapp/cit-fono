// src/screens/portero/TorresScreenV2.js
// Versión actualizada con detección de llamadas entrantes bidireccionales
// REEMPLAZA TorresScreen.js

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, AppState, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { iniciarDeteccion } from '../../modules/callDetector'
import { SPACING, RADIUS, FONT, SHADOW } from '../../theme'

const TORRE_COLORS = [
  { bg: '#f97316', light: 'rgba(249,115,22,0.15)' },
  { bg: '#38bdf8', light: 'rgba(56,189,248,0.15)' },
  { bg: '#4ade80', light: 'rgba(74,222,128,0.15)' },
  { bg: '#c084fc', light: 'rgba(192,132,252,0.15)' },
  { bg: '#fbbf24', light: 'rgba(251,191,36,0.15)' },
  { bg: '#f87171', light: 'rgba(248,113,113,0.15)' },
]

export default function TorresScreen({ navigation }) {
  const { theme, config } = useApp()
  const [torres,      setTorres]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [hora,        setHora]        = useState('')
  const [adminTaps,   setAdminTaps]   = useState(0)
  const [llamadasBadge, setLlamadasBadge] = useState(0)
  const cleanupRef = useRef(null)

  // Actualizar hora cada minuto
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setHora(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [])

  async function actualizarBadge() {
    try {
      const perdidas = await DB.getLlamadasPerdidasHoy()
      setLlamadasBadge(perdidas.length)
    } catch(e) {}
  }

  useFocusEffect(useCallback(() => {
    cargarTorres()
    actualizarBadge()
  }, []))

  async function cargarTorres() {
    setLoading(true)
    const data = await DB.getTorres()
    setTorres(data)
    setLoading(false)
  }

  function handleLogoTap() {
    const n = adminTaps + 1
    setAdminTaps(n)
    if (n >= 6) { setAdminTaps(0); navigation.navigate('AdminLogin') }
  }

  const renderTorre = ({ item, index }) => {
    const color = TORRE_COLORS[index % TORRE_COLORS.length]
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Apartamentos', { torre: item })}
        style={{
          width: '31%', // 3 columnas para tabletas
          backgroundColor: theme.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.lg,
          marginBottom: SPACING.md,
          borderWidth: 2,
          borderColor: color.bg + '60',
          ...SHADOW(theme),
        }}
        activeOpacity={0.75}
      >
        <View style={{
          width: 56, height: 56, borderRadius: RADIUS.lg,
          backgroundColor: color.light,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: SPACING.sm,
        }}>
          <Text style={{ fontSize: 28 }}>🏢</Text>
        </View>

        <Text style={{
          fontSize: FONT.xxl, fontWeight: FONT.bold, // xxl en tablet
          color: theme.text, marginBottom: 4,
        }} numberOfLines={2}>{item.nombre}</Text>

        <Text style={{
          fontSize: FONT.sm, color: color.bg,
          fontWeight: FONT.semibold, fontFamily: 'monospace',
        }}>
          {item.total_aptos} {item.total_aptos === 1 ? 'apto' : 'aptos'}
        </Text>

        <Text style={{
          fontSize: FONT.xs, color: theme.textHint,
          marginTop: 2, fontFamily: 'monospace',
        }}>
          {item.pisos} pisos
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg}/>

      {/* ── HEADER ── */}
      <View style={{
        backgroundColor: theme.surface,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
          <Text style={{
            fontSize: FONT.xxl, fontWeight: FONT.bold, color: theme.text,
          }}>🔔 {config.nombre_conjunto}</Text>
          <Text style={{
            fontSize: FONT.sm, color: theme.textHint,
            fontFamily: 'monospace', marginTop: 2,
          }}>
            {config.porteria_nombre || 'Portería Principal'} · {hora}
          </Text>
        </TouchableOpacity>

        {/* Badge llamadas perdidas */}
        {llamadasBadge > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminLogin')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.redBg,
              borderRadius: RADIUS.md,
              padding: SPACING.sm,
              marginTop: SPACING.sm,
              borderWidth: 1,
              borderColor: theme.red + '40',
            }}
          >
            <Text style={{ fontSize: 18 }}>📵</Text>
            <Text style={{
              fontSize: FONT.sm, color: theme.red,
              fontWeight: FONT.semibold, flex: 1,
            }}>
              {llamadasBadge} llamada{llamadasBadge > 1 ? 's' : ''} entrante{llamadasBadge > 1 ? 's' : ''} perdida{llamadasBadge > 1 ? 's' : ''} hoy
            </Text>
            <Text style={{ color: theme.red, fontSize: FONT.lg }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Buscador */}
        <TouchableOpacity
          onPress={() => navigation.navigate('BuscarApto', { query: '' })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.inputBg,
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING.md,
            paddingVertical: 12,
            marginTop: SPACING.md,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <Text style={{ fontSize: FONT.md, color: theme.placeholder, flex: 1 }}>
            Buscar por nombre o número de apto...
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LISTA TORRES ── */}
      {torres.length === 0 && !loading ? (
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          padding: SPACING.xl,
        }}>
          <Text style={{ fontSize: 52, marginBottom: SPACING.md }}>🏗️</Text>
          <Text style={{
            fontSize: FONT.lg, color: theme.textSub, textAlign: 'center',
          }}>
            No hay torres configuradas.{'\n'}El administrador debe configurar el directorio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={torres}
          keyExtractor={t => String(t.id)}
          renderItem={renderTorre}
          numColumns={3} // 3 columnas para tabletas
          columnWrapperStyle={{
            justifyContent: 'flex-start',
            gap: SPACING.md,
            paddingHorizontal: SPACING.md,
          }}
          contentContainerStyle={{ paddingVertical: SPACING.md }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={cargarTorres}
              tintColor={theme.accent}
            />
          }
        />
      )}
    </View>
  )
}
