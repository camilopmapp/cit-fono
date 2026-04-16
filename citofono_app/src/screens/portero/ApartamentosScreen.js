// src/screens/portero/ApartamentosScreen.js
import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StatusBar,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT, SHADOW } from '../../theme'
import { ScreenHeader, BackBtn, EmptyState } from '../../components/common'

export default function ApartamentosScreen({ route, navigation }) {
  const { torre } = route.params
  const { theme } = useApp()
  const [aptos,    setAptos]   = useState([])
  const [filtro,   setFiltro]  = useState('')
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    DB.getApartamentos(torre.id).then(data => {
      setAptos(data)
      setLoading(false)
    })
  }, [torre.id])

  const filtrados = filtro.trim()
    ? aptos.filter(a =>
        a.numero.includes(filtro.trim()) ||
        (a.residente || '').toLowerCase().includes(filtro.trim().toLowerCase())
      )
    : aptos

  // Agrupar por piso
  const porPiso = filtrados.reduce((acc, a) => {
    const p = `Piso ${a.piso}`
    if (!acc[p]) acc[p] = []
    acc[p].push(a)
    return acc
  }, {})

  const secciones = Object.entries(porPiso).sort((a, b) => {
    const pa = parseInt(a[0].replace('Piso ', ''))
    const pb = parseInt(b[0].replace('Piso ', ''))
    return pa - pb
  })

  function handleAptoPress(apto) {
    navigation.navigate('Llamar', { apto })
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>

      <ScreenHeader
        theme={theme}
        title={torre.nombre}
        subtitle={`${torre.total_aptos} apartamentos · ${torre.pisos} pisos`}
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
      />

      {/* Buscador */}
      <View style={{
        backgroundColor: theme.surface,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <TextInput
          value={filtro}
          onChangeText={setFiltro}
          placeholder="Buscar número o nombre..."
          placeholderTextColor={theme.placeholder}
          style={{
            backgroundColor: theme.inputBg,
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING.md,
            paddingVertical: 10,
            fontSize: FONT.md,
            color: theme.inputText,
            borderWidth: 1,
            borderColor: theme.border,
          }}
          keyboardType="default"
          autoCorrect={false}
        />
      </View>

      {/* Lista de aptos por piso */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          subtitle="Intenta con otro número o nombre"
          theme={theme}
        />
      ) : (
        <FlatList
          data={secciones}
          keyExtractor={([piso]) => piso}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item: [piso, aptosDelPiso] }) => (
            <View style={{ marginBottom: SPACING.md }}>
              {/* Header piso */}
              <Text style={{
                fontSize: FONT.xs, color: theme.textHint,
                fontWeight: FONT.semibold, textTransform: 'uppercase',
                letterSpacing: 1, fontFamily: 'monospace',
                marginBottom: SPACING.sm,
              }}>{piso}</Text>

              {/* Aptos del piso */}
              {aptosDelPiso.map(apto => (
                <TouchableOpacity
                  key={apto.id}
                  onPress={() => handleAptoPress(apto)}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                    marginBottom: SPACING.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                    ...SHADOW(theme),
                  }}
                  activeOpacity={0.75}
                >
                  {/* Número apto */}
                  <View style={{
                    width: 52, height: 52, borderRadius: RADIUS.md,
                    backgroundColor: theme.accentBg,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: SPACING.md,
                  }}>
                    <Text style={{
                      fontSize: FONT.lg, fontWeight: FONT.bold,
                      color: theme.accent,
                    }}>{apto.numero}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: FONT.lg, fontWeight: FONT.semibold,
                      color: theme.text, marginBottom: 2,
                    }}>
                      {apto.residente || `Apartamento ${apto.numero}`}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{
                        fontSize: FONT.sm, color: theme.textHint,
                        fontFamily: 'monospace',
                      }}>📞 apto {apto.numero}</Text>
                      {apto.dnd && (
                        <Text style={{ fontSize: FONT.xs, color: theme.red }}>
                          🔇 DND
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Flecha */}
                  <Text style={{ fontSize: 20, color: theme.accent }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </View>
  )
}
