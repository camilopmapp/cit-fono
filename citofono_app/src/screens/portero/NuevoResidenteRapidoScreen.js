// src/screens/portero/NuevoResidenteRapidoScreen.js
// Permite agregar rápidamente al directorio desde la pantalla de llamada entrante
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Alert,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../../src/db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import {
  Input, BtnPrimary, BtnSecondary,
  ScreenHeader, BackBtn,
} from '../../components/common'

export default function NuevoResidenteRapidoScreen({ route, navigation }) {
  const { numero_prellenado } = route.params || {}
  const { theme } = useApp()

  const [torres,    setTorres]    = useState([])
  const [torreId,   setTorreId]   = useState('')
  const [numero,    setNumero]    = useState('')
  const [piso,      setPiso]      = useState('1')
  const [residente, setResidente] = useState('')
  const [telNombre, setTelNombre] = useState('Principal')
  const [telNum,    setTelNum]    = useState(numero_prellenado || '')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    DB.getTorres().then(t => {
      setTorres(t)
      if (t.length > 0) setTorreId(String(t[0].id))
    })
  }, [])

  async function handleSave() {
    if (!numero.trim()) { Alert.alert('Error', 'El número de apto es requerido'); return }
    if (!torreId)       { Alert.alert('Error', 'Selecciona una torre'); return }
    if (!telNum.trim()) { Alert.alert('Error', 'El teléfono es requerido'); return }

    setSaving(true)
    await DB.insertApartamento({
      torre_id:   parseInt(torreId),
      numero:     numero.trim(),
      piso:       parseInt(piso) || 1,
      residente:  residente.trim(),
      dnd: false, dnd_inicio: '22:00', dnd_fin: '07:00',
      telefonos: [{ nombre: telNombre || 'Principal', numero: telNum.trim(), orden: 1 }],
    })
    setSaving(false)
    Alert.alert('✅ Agregado', 'Residente agregado al directorio')
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>
      <ScreenHeader
        theme={theme}
        title="➕ Agregar residente"
        subtitle="Número prellenado desde llamada"
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
      />

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>

        {/* Torre */}
        <Text style={{
          fontSize: FONT.xs, color: theme.textHint,
          fontFamily: 'monospace', textTransform: 'uppercase',
          letterSpacing: 1, marginBottom: SPACING.sm,
        }}>Torre *</Text>
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          gap: SPACING.sm, marginBottom: SPACING.md,
        }}>
          {torres.map(t => (
            <BtnSecondary
              key={t.id}
              label={t.nombre}
              onPress={() => setTorreId(String(t.id))}
              theme={theme}
              style={{
                borderColor: String(t.id) === torreId ? theme.accent : theme.border,
                backgroundColor: String(t.id) === torreId ? theme.accentBg : theme.surface,
              }}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <View style={{ flex: 2 }}>
            <Input label="Número apto *" value={numero}
                   onChangeText={setNumero} placeholder="403"
                   theme={theme} autoCapitalize="none"/>
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Piso" value={piso}
                   onChangeText={setPiso} placeholder="4"
                   keyboardType="numeric" theme={theme}/>
          </View>
        </View>

        <Input label="Nombre del residente"
               value={residente} onChangeText={setResidente}
               placeholder="García Ruiz" theme={theme}/>

        <View style={{
          backgroundColor: theme.surface, borderRadius: RADIUS.md,
          padding: SPACING.md, borderWidth: 1, borderColor: theme.border,
          marginBottom: SPACING.md,
        }}>
          <Text style={{
            fontSize: FONT.sm, fontWeight: FONT.semibold,
            color: theme.text, marginBottom: SPACING.sm,
          }}>📞 Teléfono que llamó</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Input label="Nombre" value={telNombre}
                     onChangeText={setTelNombre} placeholder="Principal"
                     theme={theme}/>
            </View>
            <View style={{ flex: 1.5 }}>
              <Input label="Número" value={telNum}
                     onChangeText={setTelNum} placeholder="+573001234567"
                     keyboardType="phone-pad" theme={theme}/>
            </View>
          </View>
        </View>

        <BtnPrimary
          label="💾 Guardar en directorio"
          onPress={handleSave}
          loading={saving}
          theme={theme}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
