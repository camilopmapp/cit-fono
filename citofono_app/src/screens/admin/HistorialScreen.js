// src/screens/admin/HistorialScreen.js
import React, { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import RNFS from 'react-native-fs'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import { Card, ScreenHeader, BackBtn, BtnSecondary, EmptyState } from '../../components/common'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function HistorialScreen({ navigation }) {
  const { theme } = useApp()
  const [historial, setHistorial] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState('hoy') // hoy|semana|mes|todo

  useFocusEffect(useCallback(() => { cargar() }, [filtro]))

  async function cargar() {
    setLoading(true)
    const hoy   = format(new Date(), 'yyyy-MM-dd')
    const desde = filtro === 'hoy'    ? hoy
                : filtro === 'semana' ? format(subDays(new Date(), 7), 'yyyy-MM-dd')
                : filtro === 'mes'    ? format(subDays(new Date(), 30), 'yyyy-MM-dd')
                : null
    const data = await DB.getHistorial({ limit: 200, desde })
    setHistorial(data)
    setLoading(false)
  }

  async function exportarCSV() {
    const header = 'Fecha,Hora,Torre,Apto,Residente,Telefono,Nombre_Tel,Atendida,Duracion_seg\n'
    const rows = historial.map(h => [
      h.timestamp?.substring(0, 10),
      h.timestamp?.substring(11, 19),
      h.torre, h.numero_apto, h.residente || '',
      h.tel_llamado || '', h.nombre_tel || '',
      h.atendida ? 'Sí' : 'No',
      h.duracion_seg || 0,
    ].join(',')).join('\n')

    const path = `${RNFS.DownloadDirectoryPath}/citofonia_historial_${format(new Date(), 'yyyyMMdd')}.csv`
    await RNFS.writeFile(path, header + rows, 'utf8')
    Alert.alert('✅ Exportado', `Archivo guardado en:\n${path}`)
  }

  const FILTROS = [
    { id: 'hoy',    label: 'Hoy' },
    { id: 'semana', label: '7 días' },
    { id: 'mes',    label: '30 días' },
    { id: 'todo',   label: 'Todo' },
  ]

  const atendidas  = historial.filter(h => h.atendida).length
  const noAtend    = historial.length - atendidas

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>

      <ScreenHeader
        theme={theme}
        title="📋 Historial"
        subtitle={`${historial.length} registros`}
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
        right={
          <BtnSecondary
            label="⬇ CSV"
            onPress={exportarCSV}
            theme={theme}
            style={{ paddingVertical: 8, paddingHorizontal: 12 }}
          />
        }
      />

      {/* Filtros de período */}
      <View style={{
        backgroundColor: theme.surface,
        flexDirection: 'row',
        padding: SPACING.sm,
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFiltro(f.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: RADIUS.md,
              backgroundColor: filtro === f.id ? theme.accentBg : theme.surface2,
              borderWidth: 1,
              borderColor: filtro === f.id ? theme.accent : theme.border,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontSize: FONT.sm,
              color: filtro === f.id ? theme.accent : theme.textSub,
              fontWeight: filtro === f.id ? FONT.semibold : FONT.regular,
            }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mini stats */}
      <View style={{
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.md,
        paddingBottom: 0,
      }}>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: theme.greenBg, borderRadius: RADIUS.md,
          padding: SPACING.sm,
        }}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <View>
            <Text style={{ fontSize: FONT.xl, fontWeight: FONT.bold, color: theme.green }}>
              {atendidas}
            </Text>
            <Text style={{ fontSize: FONT.xs, color: theme.green, fontFamily: 'monospace' }}>
              ATENDIDAS
            </Text>
          </View>
        </View>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: theme.redBg, borderRadius: RADIUS.md,
          padding: SPACING.sm,
        }}>
          <Text style={{ fontSize: 20 }}>❌</Text>
          <View>
            <Text style={{ fontSize: FONT.xl, fontWeight: FONT.bold, color: theme.red }}>
              {noAtend}
            </Text>
            <Text style={{ fontSize: FONT.xs, color: theme.red, fontFamily: 'monospace' }}>
              SIN RESP.
            </Text>
          </View>
        </View>
      </View>

      {/* Lista */}
      {historial.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sin registros"
          subtitle="Las llamadas realizadas aparecerán aquí"
          theme={theme}
        />
      ) : (
        <FlatList
          data={historial}
          keyExtractor={h => String(h.id)}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item: h }) => {
            const fecha = h.timestamp
              ? new Date(h.timestamp.replace(' ', 'T'))
              : new Date()
            return (
              <View style={{
                backgroundColor: theme.surface,
                borderRadius: RADIUS.lg,
                padding: SPACING.md,
                marginBottom: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                gap: SPACING.md,
              }}>
                {/* Icono estado */}
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: h.atendida ? theme.greenBg : theme.redBg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>{h.atendida ? '✅' : '❌'}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: FONT.md, fontWeight: FONT.semibold, color: theme.text,
                  }}>
                    {h.torre} · Apto {h.numero_apto}
                  </Text>
                  <Text style={{ fontSize: FONT.sm, color: theme.textSub }}>
                    {h.residente || 'Sin nombre'}
                  </Text>
                  {h.tel_llamado ? (
                    <Text style={{
                      fontSize: FONT.xs, color: theme.textHint,
                      fontFamily: 'monospace', marginTop: 2,
                    }}>
                      📞 {h.nombre_tel}: {h.tel_llamado}
                    </Text>
                  ) : null}
                </View>

                {/* Fecha/hora */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: FONT.sm, color: theme.textHint,
                    fontFamily: 'monospace',
                  }}>
                    {h.timestamp?.substring(11, 16)}
                  </Text>
                  <Text style={{
                    fontSize: FONT.xs, color: theme.textHint,
                    fontFamily: 'monospace', marginTop: 2,
                  }}>
                    {h.timestamp?.substring(5, 10).replace('-', '/')}
                  </Text>
                  {h.duracion_seg > 0 && (
                    <Text style={{
                      fontSize: FONT.xs, color: theme.accent,
                      fontFamily: 'monospace', marginTop: 2,
                    }}>
                      {h.duracion_seg}s
                    </Text>
                  )}
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}
