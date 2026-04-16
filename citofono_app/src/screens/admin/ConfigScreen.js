// src/screens/admin/ConfigScreen.js
import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Alert, StatusBar,
  TouchableOpacity,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import {
  Input, BtnPrimary, Card, ScreenHeader, BackBtn,
  SectionTitle, Toggle, BtnSecondary,
} from '../../components/common'
import { activarModoKiosko, desactivarModoKiosko, estaEnModoKiosko } from '../../modules/callDetector'

export default function ConfigScreen({ navigation }) {
  const { theme, config, updateConfig, toggleTheme } = useApp()
  const [nombre,    setNombre]    = useState('')
  const [porteria,  setPorteria]  = useState('')
  const [pinConf,   setPinConf]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [kiosko,    setKiosko]    = useState(false)

  useEffect(() => {
    async function checkKiosko() {
      const active = await estaEnModoKiosko()
      setKiosko(active)
    }
    checkKiosko()
  }, [])

  useEffect(() => {
    setNombre(config.nombre_conjunto || '')
    setPorteria(config.porteria_nombre || '')
  }, [config])

  async function guardarGeneral() {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre del conjunto es requerido'); return }
    setSaving(true)
    await updateConfig('nombre_conjunto', nombre.trim())
    await updateConfig('porteria_nombre', porteria.trim())
    setSaving(false)
    Alert.alert('✅ Guardado', 'Configuración actualizada')
  }

  async function cambiarPin() {
    if (pinActual !== config.admin_pin) {
      Alert.alert('Error', 'El PIN actual no es correcto'); return
    }
    if (pinNuevo.length !== 6) {
      Alert.alert('Error', 'El nuevo PIN debe tener exactamente 6 dígitos'); return
    }
    if (pinNuevo !== pinConf) {
      Alert.alert('Error', 'Los PINs nuevos no coinciden'); return
    }
    await updateConfig('admin_pin', pinNuevo)
    setPinActual(''); setPinNuevo(''); setPinConf('')
    Alert.alert('✅ PIN actualizado', 'El nuevo PIN está activo')
  }

  async function toggleKiosko(val) {
    if (val) {
      activarModoKiosko()
      await updateConfig('kiosk_mode', 'true')
    } else {
      desactivarModoKiosko()
      await updateConfig('kiosk_mode', 'false')
    }
    setKiosko(val)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>
      <ScreenHeader
        theme={theme}
        title="⚙️ Configuración"
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
      />

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>

        {/* ── Tema visual ── */}
        <SectionTitle title="Apariencia" theme={theme}/>
        <Card theme={theme} style={{ marginBottom: SPACING.md }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: SPACING.md,
          }}>
            <Text style={{ fontSize: FONT.md, color: theme.text, fontWeight: FONT.medium }}>
              Tema visual
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {[
              { id: 'dark', label: '🌙 Oscuro', desc: 'Fondo negro, ideal de noche' },
              { id: 'light', label: '☀️ Claro', desc: 'Fondo blanco, ideal de día' },
            ].map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => toggleTheme(t.id)}
                style={{
                  flex: 1,
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  borderWidth: 2,
                  borderColor: config.theme_mode === t.id ? theme.accent : theme.border,
                  backgroundColor: config.theme_mode === t.id ? theme.accentBg : theme.surface2,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{t.label.split(' ')[0]}</Text>
                <Text style={{
                  fontSize: FONT.sm, fontWeight: FONT.semibold,
                  color: config.theme_mode === t.id ? theme.accent : theme.text,
                }}>{t.label.split(' ')[1]}</Text>
                <Text style={{
                  fontSize: FONT.xs, color: theme.textHint,
                  textAlign: 'center', marginTop: 2,
                }}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Información del conjunto ── */}
        <SectionTitle title="Información del conjunto" theme={theme}/>
        <Card theme={theme} style={{ marginBottom: SPACING.md }}>
          <Input
            label="Nombre del conjunto residencial"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Conjunto Los Pinos"
            theme={theme}
          />
          <Input
            label="Nombre de la portería"
            value={porteria}
            onChangeText={setPorteria}
            placeholder="Portería Principal"
            theme={theme}
          />
          <BtnPrimary
            label="💾 Guardar"
            onPress={guardarGeneral}
            loading={saving}
            theme={theme}
          />
        </Card>

        {/* ── Cambiar PIN ── */}
        <SectionTitle title="Seguridad" theme={theme}/>
        <Card theme={theme} style={{ marginBottom: SPACING.md }}>
          <Text style={{
            fontSize: FONT.md, fontWeight: FONT.semibold,
            color: theme.text, marginBottom: SPACING.sm,
          }}>🔐 Cambiar PIN de administrador</Text>
          <Text style={{
            fontSize: FONT.sm, color: theme.textHint, marginBottom: SPACING.md,
          }}>
            El PIN tiene 6 dígitos. Se usa para acceder al modo administrador.
          </Text>

          <Input
            label="PIN actual"
            value={pinActual}
            onChangeText={setPinActual}
            placeholder="••••••"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            theme={theme}
          />
          <Input
            label="Nuevo PIN"
            value={pinNuevo}
            onChangeText={setPinNuevo}
            placeholder="••••••"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            theme={theme}
          />
          <Input
            label="Confirmar nuevo PIN"
            value={pinConf}
            onChangeText={setPinConf}
            placeholder="••••••"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            theme={theme}
          />
          <BtnPrimary
            label="🔐 Cambiar PIN"
            onPress={cambiarPin}
            theme={theme}
          />
        </Card>

        {/* ── Control de Dispositivo ── */}
        <SectionTitle title="Control del Dispositivo" theme={theme}/>
        <Card theme={theme} style={{ marginBottom: SPACING.md }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: SPACING.sm,
          }}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={{ fontSize: FONT.md, color: theme.text, fontWeight: FONT.semibold }}>
                Modo Kiosko (Bloqueo)
              </Text>
              <Text style={{ fontSize: FONT.xs, color: theme.textHint, marginTop: 2 }}>
                Impide salir de la aplicación. Muy recomendado para tabletas fijas.
              </Text>
            </View>
            <Toggle
              value={kiosko}
              onValueChange={toggleKiosko}
              theme={theme}
            />
          </View>
        </Card>

        <Card theme={theme} style={{ marginBottom: SPACING.md, backgroundColor: theme.surface2 }}>
          <Text style={{
            fontSize: FONT.sm, fontWeight: FONT.bold,
            color: theme.textSub, marginBottom: SPACING.sm,
          }}>🛠️ Diagnóstico de Seguridad</Text>
          
          <TouchableOpacity 
            onPress={() => Alert.alert('Ayuda', 'Asegúrate de conceder el permiso de "Mostrar sobre otras apps" en los ajustes de Android.')}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
          >
            <Text style={{ fontSize: FONT.sm, color: theme.text }}>Permiso de Superposición</Text>
            <Text style={{ fontSize: FONT.sm, color: theme.green }}>CONFIGURADO</Text>
          </TouchableOpacity>
        </Card>

        {/* ── Info de la app ── */}
        <Card theme={theme} style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
          <Text style={{ fontSize: 36, marginBottom: SPACING.sm }}>🔔</Text>
          <Text style={{
            fontSize: FONT.lg, fontWeight: FONT.bold, color: theme.text,
          }}>Citofonía App</Text>
          <Text style={{
            fontSize: FONT.sm, color: theme.textHint,
            fontFamily: 'monospace', marginTop: 4,
          }}>Versión 1.0.0</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint, marginTop: 8, textAlign: 'center',
          }}>
            Sistema de citofonía digital{'\n'}para conjuntos residenciales
          </Text>
        </Card>

      </ScrollView>
    </View>
  )
}
