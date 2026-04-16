// src/screens/portero/NotasScreen.js
// Notas del portero por residente — visible en la pantalla de llamada
import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, Alert, ScrollView,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import { ScreenHeader, BackBtn, BtnPrimary } from '../../components/common'

export default function NotasScreen({ route, navigation }) {
  const { apto } = route.params
  const { theme } = useApp()
  const [nota,   setNota]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    DB.getNota(apto.id).then(setNota)
  }, [apto.id])

  async function guardar() {
    setSaving(true)
    await DB.setNota(apto.id, nota)
    setSaving(false)
    Alert.alert('✅ Nota guardada')
    navigation.goBack()
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>
      <ScreenHeader
        theme={theme}
        title="📝 Notas"
        subtitle={`${apto.torre_nombre} · Apto ${apto.numero} · ${apto.residente || ''}`}
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
      />

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>

        <View style={{
          backgroundColor: theme.amberBg,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          borderWidth: 1,
          borderColor: theme.amber + '40',
          marginBottom: SPACING.md,
        }}>
          <Text style={{ color: theme.amber, fontSize: FONT.sm }}>
            💡 Las notas son visibles al portero cuando llega una llamada de este apartamento.
            Útil para indicaciones especiales, mascotas, acceso, etc.
          </Text>
        </View>

        <TextInput
          value={nota}
          onChangeText={setNota}
          placeholder="Ej: Recibe paquetes de DHL frecuentemente. Tiene perro grande. Llamar dos veces antes de abrir portón..."
          placeholderTextColor={theme.placeholder}
          multiline
          numberOfLines={8}
          style={{
            backgroundColor: theme.inputBg,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            fontSize: FONT.md,
            color: theme.inputText,
            minHeight: 180,
            textAlignVertical: 'top',
            marginBottom: SPACING.md,
            lineHeight: FONT.md * 1.6,
          }}
        />

        <Text style={{
          fontSize: FONT.xs, color: theme.textHint,
          fontFamily: 'monospace', textAlign: 'right',
          marginBottom: SPACING.md,
        }}>
          {nota.length} caracteres
        </Text>

        <BtnPrimary
          label="💾 Guardar nota"
          onPress={guardar}
          loading={saving}
          theme={theme}
        />

        {nota.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Borrar nota', '¿Eliminar la nota de este residente?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive',
                  onPress: async () => {
                    await DB.setNota(apto.id, '')
                    setNota('')
                    navigation.goBack()
                  }
                },
              ])
            }}
            style={{
              marginTop: SPACING.md,
              padding: SPACING.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: theme.red, fontSize: FONT.md }}>
              🗑️ Borrar nota
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}
