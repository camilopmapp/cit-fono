// src/screens/admin/TorresAdminScreen.js
import React, { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, StatusBar, Modal, ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import {
  Input, BtnPrimary, BtnDanger, BtnSecondary,
  Card, ScreenHeader, EmptyState,
} from '../../components/common'

function TorreModal({ visible, onClose, onSave, torre, theme }) {
  const [nombre, setNombre] = useState(torre?.nombre || '')
  const [pisos,  setPisos]  = useState(String(torre?.pisos || 8))
  const [orden,  setOrden]  = useState(String(torre?.orden_ui || 1))

  React.useEffect(() => {
    if (torre) {
      setNombre(torre.nombre || '')
      setPisos(String(torre.pisos || 8))
      setOrden(String(torre.orden_ui || 1))
    } else {
      setNombre(''); setPisos('8'); setOrden('1')
    }
  }, [torre, visible])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: SPACING.lg,
        }}>
          <Text style={{
            fontSize: FONT.xl, fontWeight: FONT.bold,
            color: theme.text, marginBottom: SPACING.md,
          }}>{torre ? '✏️ Editar torre' : '➕ Nueva torre'}</Text>

          <Input label="Nombre *" value={nombre} onChangeText={setNombre}
                 placeholder="Torre A, Bloque 3..." theme={theme}/>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Input label="Pisos" value={pisos} onChangeText={setPisos}
                     keyboardType="numeric" placeholder="8" theme={theme}/>
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Orden pantalla" value={orden} onChangeText={setOrden}
                     keyboardType="numeric" placeholder="1" theme={theme}/>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <BtnSecondary label="Cancelar" onPress={onClose} theme={theme} style={{ flex: 1 }}/>
            <BtnPrimary
              label="Guardar"
              onPress={() => {
                if (!nombre.trim()) { Alert.alert('Error','Nombre requerido'); return }
                onSave({ nombre: nombre.trim(), pisos: parseInt(pisos)||8,
                         orden_ui: parseInt(orden)||1 })
              }}
              theme={theme}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function TorresAdminScreen() {
  const { theme } = useApp()
  const [torres,  setTorres]  = useState([])
  const [modal,   setModal]   = useState(false)
  const [editando,setEditando]= useState(null)

  useFocusEffect(useCallback(() => { DB.getTorres().then(setTorres) }, []))

  async function handleSave(data) {
    if (editando) {
      await DB.updateTorre(editando.id, data.nombre, data.pisos, data.orden_ui)
    } else {
      await DB.insertTorre(data.nombre, data.pisos, data.orden_ui)
    }
    setModal(false); setEditando(null)
    DB.getTorres().then(setTorres)
  }

  async function handleDelete(t) {
    Alert.alert(
      '🗑️ Eliminar',
      `¿Eliminar "${t.nombre}" y sus ${t.total_aptos} apartamentos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await DB.deleteTorre(t.id)
          DB.getTorres().then(setTorres)
        }},
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg}/>
      <View style={{ padding: SPACING.md }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between',
                       alignItems:'center', marginBottom: SPACING.md }}>
          <Text style={{ fontSize: FONT.xxl, fontWeight: FONT.bold, color: theme.text }}>
            🏢 Torres
          </Text>
          <BtnPrimary
            label="+ Nueva"
            onPress={() => { setEditando(null); setModal(true) }}
            theme={theme}
            style={{ paddingVertical: 10, paddingHorizontal: SPACING.md }}
          />
        </View>

        {torres.length === 0 ? (
          <EmptyState icon="🏗️" title="Sin torres" subtitle="Agrega la primera torre" theme={theme}/>
        ) : (
          <FlatList
            data={torres}
            keyExtractor={t => String(t.id)}
            renderItem={({ item: t }) => (
              <Card theme={theme} style={{ marginBottom: SPACING.sm }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap: SPACING.md }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: RADIUS.md,
                    backgroundColor: theme.accentBg,
                    alignItems:'center', justifyContent:'center',
                  }}>
                    <Text style={{ fontSize: 24 }}>🏢</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONT.lg, fontWeight: FONT.bold, color: theme.text }}>
                      {t.nombre}
                    </Text>
                    <Text style={{ fontSize: FONT.sm, color: theme.textHint, fontFamily:'monospace' }}>
                      {t.total_aptos} aptos · {t.pisos} pisos · Orden: {t.orden_ui}
                    </Text>
                  </View>
                  <View style={{ flexDirection:'row', gap: SPACING.sm }}>
                    <TouchableOpacity
                      onPress={() => { setEditando(t); setModal(true) }}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: theme.surface2,
                        alignItems:'center', justifyContent:'center',
                        borderWidth: 1, borderColor: theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(t)}
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: theme.redBg,
                        alignItems:'center', justifyContent:'center',
                        borderWidth: 1, borderColor: theme.red + '40',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <TorreModal
        visible={modal}
        onClose={() => { setModal(false); setEditando(null) }}
        onSave={handleSave}
        torre={editando}
        theme={theme}
      />
    </View>
  )
}
