// src/screens/admin/ResidentesScreen.js
import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT, SHADOW } from '../../theme'
import {
  BtnPrimary, BtnSecondary, BtnDanger,
  Input, Card, ScreenHeader, BackBtn,
  Toggle, EmptyState, Divider,
} from '../../components/common'

// ── Modal de edición de apartamento ──────────────────────────────
function AptoModal({ visible, onClose, onSave, apto, torres, theme }) {
  const [torre_id,   setTorreId]   = useState('')
  const [numero,     setNumero]    = useState('')
  const [piso,       setPiso]      = useState('1')
  const [residente,  setResidente] = useState('')
  const [dnd,        setDnd]       = useState(false)
  const [dndInicio,  setDndInicio] = useState('22:00')
  const [dndFin,     setDndFin]    = useState('07:00')
  const [telefonos,  setTelefonos] = useState([{ nombre: 'Principal', numero: '', orden: 1 }])
  const [saving,     setSaving]    = useState(false)

  useEffect(() => {
    if (apto) {
      setTorreId(String(apto.torre_id))
      setNumero(apto.numero || '')
      setPiso(String(apto.piso || 1))
      setResidente(apto.residente || '')
      setDnd(!!apto.dnd)
      setDndInicio(apto.dnd_inicio || '22:00')
      setDndFin(apto.dnd_fin || '07:00')
      setTelefonos(
        apto.telefonos?.length
          ? apto.telefonos.map(t => ({ ...t, numero: t.numero || '' }))
          : [{ nombre: 'Principal', numero: '', orden: 1 }]
      )
    } else {
      setTorreId(torres[0]?.id ? String(torres[0].id) : '')
      setNumero('')
      setPiso('1')
      setResidente('')
      setDnd(false)
      setDndInicio('22:00')
      setDndFin('07:00')
      setTelefonos([{ nombre: 'Principal', numero: '', orden: 1 }])
    }
  }, [apto, torres, visible])

  function addTel() {
    setTelefonos(prev => [
      ...prev,
      { nombre: '', numero: '', orden: prev.length + 1 }
    ])
  }

  function updateTel(idx, field, value) {
    setTelefonos(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: value } : t
    ))
  }

  function removeTel(idx) {
    setTelefonos(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!numero.trim()) { Alert.alert('Error', 'El número de apartamento es requerido'); return }
    if (!torre_id)      { Alert.alert('Error', 'Selecciona una torre'); return }
    const telsValidos = telefonos.filter(t => t.numero.trim())
    if (!telsValidos.length) { Alert.alert('Error', 'Agrega al menos un teléfono'); return }

    setSaving(true)
    const data = {
      torre_id: parseInt(torre_id),
      numero: numero.trim(),
      piso: parseInt(piso) || 1,
      residente: residente.trim(),
      dnd, dnd_inicio: dndInicio, dnd_fin: dndFin,
      telefonos: telsValidos.map((t, i) => ({
        ...t, orden: i + 1,
        nombre: t.nombre.trim() || `Teléfono ${i + 1}`,
      })),
    }
    if (apto) data.id = apto.id
    await onSave(data)
    setSaving(false)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader
          theme={theme}
          title={apto ? '✏️ Editar apartamento' : '➕ Nuevo apartamento'}
          left={<BackBtn onPress={onClose} theme={theme}/>}
          right={
            <BtnPrimary
              label="Guardar"
              onPress={handleSave}
              loading={saving}
              theme={theme}
              style={{ paddingVertical: 10, paddingHorizontal: SPACING.md }}
            />
          }
        />

        <ScrollView contentContainerStyle={{ padding: SPACING.md }}>

          {/* Torre */}
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 6,
          }}>Torre *</Text>
          <View style={{
            flexDirection: 'row', flexWrap: 'wrap',
            gap: SPACING.sm, marginBottom: SPACING.md,
          }}>
            {torres.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTorreId(String(t.id))}
                style={{
                  paddingHorizontal: SPACING.md,
                  paddingVertical: 10,
                  borderRadius: RADIUS.md,
                  borderWidth: 2,
                  borderColor: String(t.id) === torre_id ? theme.accent : theme.border,
                  backgroundColor: String(t.id) === torre_id ? theme.accentBg : theme.surface,
                }}
              >
                <Text style={{
                  color: String(t.id) === torre_id ? theme.accent : theme.text,
                  fontWeight: FONT.semibold,
                }}>{t.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Número y piso */}
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 2 }}>
              <Input
                label="Número de apto *"
                value={numero}
                onChangeText={setNumero}
                placeholder="403"
                keyboardType="default"
                theme={theme}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Piso"
                value={piso}
                onChangeText={setPiso}
                placeholder="4"
                keyboardType="numeric"
                theme={theme}
              />
            </View>
          </View>

          {/* Residente */}
          <Input
            label="Nombre del residente (opcional)"
            value={residente}
            onChangeText={setResidente}
            placeholder="García Ruiz"
            theme={theme}
          />

          {/* Teléfonos */}
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: SPACING.sm,
          }}>Teléfonos *</Text>

          {telefonos.map((tel, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: theme.surface,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                marginBottom: SPACING.sm,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 12, color: theme.accent, fontWeight: FONT.bold }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: theme.textHint, fontSize: FONT.sm }}>
                  {idx === 0 ? 'Principal' : `Alternativo ${idx}`}
                </Text>
                {idx > 0 && (
                  <TouchableOpacity onPress={() => removeTel(idx)}>
                    <Text style={{ color: theme.red, fontSize: FONT.lg }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TextInput
                  value={tel.nombre}
                  onChangeText={v => updateTel(idx, 'nombre', v)}
                  placeholder="Mamá, Papá, Oficina..."
                  placeholderTextColor={theme.placeholder}
                  style={{
                    flex: 1,
                    backgroundColor: theme.inputBg,
                    borderWidth: 1, borderColor: theme.inputBorder,
                    borderRadius: RADIUS.sm,
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 10,
                    fontSize: FONT.md, color: theme.inputText,
                  }}
                />
                <TextInput
                  value={tel.numero}
                  onChangeText={v => updateTel(idx, 'numero', v)}
                  placeholder="+57300..."
                  placeholderTextColor={theme.placeholder}
                  keyboardType="phone-pad"
                  style={{
                    flex: 1.3,
                    backgroundColor: theme.inputBg,
                    borderWidth: 1, borderColor: theme.inputBorder,
                    borderRadius: RADIUS.sm,
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: 10,
                    fontSize: FONT.md, color: theme.inputText,
                    fontFamily: 'monospace',
                  }}
                />
              </View>
            </View>
          ))}

          <BtnSecondary
            label="+ Agregar teléfono"
            onPress={addTel}
            theme={theme}
            style={{ marginBottom: SPACING.md }}
          />

          {/* DND */}
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: SPACING.md,
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: dnd ? SPACING.md : 0,
            }}>
              <View>
                <Text style={{ fontSize: FONT.md, color: theme.text, fontWeight: FONT.medium }}>
                  🔇 No Molestar
                </Text>
                <Text style={{ fontSize: FONT.sm, color: theme.textHint }}>
                  Restricción de llamadas en horario
                </Text>
              </View>
              <Toggle value={dnd} onValueChange={setDnd} theme={theme}/>
            </View>

            {dnd && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <Input
                  label="Desde"
                  value={dndInicio}
                  onChangeText={setDndInicio}
                  placeholder="22:00"
                  theme={theme}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Hasta"
                  value={dndFin}
                  onChangeText={setDndFin}
                  placeholder="07:00"
                  theme={theme}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>

          {/* Eliminar (solo edición) */}
          {apto && (
            <BtnDanger
              label="🗑️ Eliminar apartamento"
              onPress={() => Alert.alert(
                'Eliminar',
                `¿Eliminar apto ${apto.numero}?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive',
                    onPress: async () => {
                      await DB.deleteApartamento(apto.id)
                      onClose()
                    }
                  },
                ]
              )}
              theme={theme}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Pantalla principal de residentes ─────────────────────────────
export default function ResidentesScreen({ route, navigation }) {
  const { theme } = useApp()
  const torreParam = route.params?.torre || null
  const [torres,    setTorres]    = useState([])
  const [aptos,     setAptos]     = useState([])
  const [filtro,    setFiltro]    = useState('')
  const [torreId,   setTorreId]   = useState(torreParam?.id || null)
  const [modal,     setModal]     = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [loading,   setLoading]   = useState(true)

  useFocusEffect(useCallback(() => { cargar() }, [torreId]))

  async function cargar() {
    setLoading(true)
    const [t, a] = await Promise.all([
      DB.getTorres(),
      DB.getApartamentos(torreId),
    ])
    setTorres(t)
    setAptos(a)
    setLoading(false)
  }

  const filtrados = filtro.trim()
    ? aptos.filter(a =>
        a.numero.includes(filtro.trim()) ||
        (a.residente || '').toLowerCase().includes(filtro.trim().toLowerCase())
      )
    : aptos

  async function handleSave(data) {
    if (data.id) {
      await DB.updateApartamento(data)
    } else {
      await DB.insertApartamento(data)
    }
    setModal(false)
    setEditando(null)
    cargar()
  }

  function abrirEditar(apto) {
    setEditando(apto)
    setModal(true)
  }

  function abrirNuevo() {
    setEditando(null)
    setModal(true)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>

      <ScreenHeader
        theme={theme}
        title="🏠 Residentes"
        subtitle={`${aptos.length} apartamentos`}
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
        right={
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <BtnSecondary
              label="⬆️ Importar"
              onPress={() => navigation.navigate('Importar')}
              theme={theme}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            />
            <BtnPrimary
              label="+ Nuevo"
              onPress={abrirNuevo}
              theme={theme}
              style={{ paddingVertical: 8, paddingHorizontal: 12 }}
            />
          </View>
        }
      />

      {/* Filtros */}
      <View style={{
        backgroundColor: theme.surface,
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        gap: SPACING.sm,
      }}>
        {/* Filtro por torre */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={() => setTorreId(null)}
              style={{
                paddingHorizontal: SPACING.md, paddingVertical: 8,
                borderRadius: RADIUS.full,
                backgroundColor: !torreId ? theme.accentBg : theme.surface2,
                borderWidth: 1,
                borderColor: !torreId ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                color: !torreId ? theme.accent : theme.textSub,
                fontWeight: FONT.medium, fontSize: FONT.sm,
              }}>Todas</Text>
            </TouchableOpacity>
            {torres.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTorreId(t.id)}
                style={{
                  paddingHorizontal: SPACING.md, paddingVertical: 8,
                  borderRadius: RADIUS.full,
                  backgroundColor: torreId === t.id ? theme.accentBg : theme.surface2,
                  borderWidth: 1,
                  borderColor: torreId === t.id ? theme.accent : theme.border,
                }}
              >
                <Text style={{
                  color: torreId === t.id ? theme.accent : theme.textSub,
                  fontWeight: FONT.medium, fontSize: FONT.sm,
                }}>{t.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Búsqueda */}
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
            borderColor: theme.inputBorder,
          }}
        />
      </View>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="Sin apartamentos"
          subtitle="Toca '+ Nuevo' para agregar el primero o importa desde Excel"
          theme={theme}
        />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item: a }) => (
            <TouchableOpacity
              onPress={() => abrirEditar({ ...a, telefonos: [] })}
              style={{
                backgroundColor: theme.surface,
                borderRadius: RADIUS.lg,
                padding: SPACING.md,
                marginBottom: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                gap: SPACING.md,
              }}
              activeOpacity={0.75}
            >
              {/* Número */}
              <View style={{
                width: 52, height: 52, borderRadius: RADIUS.md,
                backgroundColor: theme.accentBg,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: FONT.lg, fontWeight: FONT.bold, color: theme.accent,
                }}>{a.numero}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: FONT.md, fontWeight: FONT.semibold,
                  color: theme.text,
                }}>{a.residente || `Apto ${a.numero}`}</Text>
                <Text style={{
                  fontSize: FONT.xs, color: theme.textHint,
                  fontFamily: 'monospace',
                }}>
                  {a.torre_nombre} · Piso {a.piso}
                  {a.dnd ? ' · 🔇' : ''}
                </Text>
              </View>

              <Text style={{ color: theme.textHint, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal edición */}
      <AptoModal
        visible={modal}
        onClose={() => { setModal(false); setEditando(null) }}
        onSave={handleSave}
        apto={editando}
        torres={torres}
        theme={theme}
      />
    </View>
  )
}
