// src/screens/admin/DashboardScreen.js — v2
import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT, SHADOW } from '../../theme'
import { Card, SectionTitle } from '../../components/common'

export default function DashboardScreen({ navigation }) {
  const { theme, config, logoutAdmin } = useApp()
  const [stats,    setStats]    = useState({
    total: 0, atendidas: 0,
    entrantesPerdidas: 0, entrantesAtendidas: 0, salientesAtendidas: 0,
  })
  const [historial,   setHistorial]   = useState([])
  const [torres,      setTorres]      = useState([])
  const [topLlamantes,setTopLlamantes]= useState([])
  const [perdidas,    setPerdidas]    = useState([])
  const [loading,     setLoading]     = useState(true)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    setLoading(true)
    const [s, h, t, top, p] = await Promise.all([
      DB.getStatsHoy(),
      DB.getHistorial({ limit: 6 }),
      DB.getTorres(),
      DB.getTopLlamantes(5),
      DB.getLlamadasPerdidasHoy(),
    ])
    setStats(s)
    setHistorial(h)
    setTorres(t)
    setTopLlamantes(top)
    setPerdidas(p)
    setLoading(false)
  }

  const totalAptos = torres.reduce((s, t) => s + (t.total_aptos || 0), 0)
  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: SPACING.md }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={cargar}
          tintColor={theme.accent}
        />
      }
    >
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg}/>

      {/* ── Header ── */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{
          fontSize: FONT.xxl, fontWeight: FONT.bold, color: theme.text,
        }}>📊 Dashboard</Text>
        <Text style={{
          fontSize: FONT.sm, color: theme.textHint,
          fontFamily: 'monospace', textTransform: 'capitalize',
        }}>
          {config.nombre_conjunto} · {hoy}
        </Text>
      </View>

      {/* ── Alerta llamadas perdidas ── */}
      {perdidas.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Historial')}
          style={{
            backgroundColor: theme.redBg,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            marginBottom: SPACING.md,
            borderWidth: 1,
            borderColor: theme.red + '50',
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          <Text style={{ fontSize: 28 }}>📵</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: FONT.md, fontWeight: FONT.bold,
              color: theme.red,
            }}>
              {perdidas.length} llamada{perdidas.length > 1 ? 's' : ''} entrante{perdidas.length > 1 ? 's' : ''} perdida{perdidas.length > 1 ? 's' : ''} hoy
            </Text>
            <Text style={{ fontSize: FONT.sm, color: theme.red + 'cc' }}>
              Toca para ver el historial completo
            </Text>
          </View>
          <Text style={{ color: theme.red, fontSize: FONT.xl }}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── KPIs hoy ── */}
      <SectionTitle title="Llamadas hoy" theme={theme}/>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.accent,
          }}>{stats.total}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textAlign: 'center',
          }}>TOTAL</Text>
        </Card>
        <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.green,
          }}>{stats.atendidas}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textAlign: 'center',
          }}>ATENDIDAS</Text>
        </Card>
        <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.red,
          }}>{stats.total - stats.atendidas}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace', textAlign: 'center',
          }}>SIN RESP.</Text>
        </Card>
      </View>

      {/* Desglose entrantes/salientes */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
        <Card theme={theme} style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, marginBottom: 4 }}>📤</Text>
          <Text style={{
            fontSize: FONT.xl, fontWeight: FONT.bold,
            color: theme.blue,
          }}>{stats.salientesAtendidas}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace',
          }}>SALIENTES{'\n'}ATENDIDAS</Text>
        </Card>
        <Card theme={theme} style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, marginBottom: 4 }}>📥</Text>
          <Text style={{
            fontSize: FONT.xl, fontWeight: FONT.bold,
            color: theme.green,
          }}>{stats.entrantesAtendidas}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace',
          }}>ENTRANTES{'\n'}ATENDIDAS</Text>
        </Card>
        <Card theme={theme} style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, marginBottom: 4 }}>📵</Text>
          <Text style={{
            fontSize: FONT.xl, fontWeight: FONT.bold,
            color: theme.red,
          }}>{stats.entrantesPerdidas}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint,
            fontFamily: 'monospace',
          }}>ENTRANTES{'\n'}PERDIDAS</Text>
        </Card>
      </View>

      {/* ── Directorio resumen ── */}
      <SectionTitle title="Directorio" theme={theme}/>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
        <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.blue,
          }}>{torres.length}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint, fontFamily: 'monospace',
          }}>TORRES</Text>
        </Card>
        <Card theme={theme} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.accent,
          }}>{totalAptos}</Text>
          <Text style={{
            fontSize: FONT.xs, color: theme.textHint, fontFamily: 'monospace',
          }}>APTOS</Text>
        </Card>
      </View>

      {/* Torres rápidas */}
      {torres.map(t => (
        <Card key={t.id} theme={theme} style={{ marginBottom: SPACING.sm }}
              onPress={() => navigation.navigate('AdminResidentes', { torre: t })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <View style={{
              width: 44, height: 44, borderRadius: RADIUS.md,
              backgroundColor: theme.accentBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22 }}>🏢</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: FONT.md, fontWeight: FONT.semibold, color: theme.text,
              }}>{t.nombre}</Text>
              <Text style={{
                fontSize: FONT.sm, color: theme.textHint, fontFamily: 'monospace',
              }}>
                {t.total_aptos} aptos · {t.pisos} pisos
              </Text>
            </View>
            <Text style={{ color: theme.accent, fontSize: FONT.xl }}>›</Text>
          </View>
        </Card>
      ))}

      {/* ── Top llamantes (30 días) ── */}
      {topLlamantes.length > 0 && (
        <>
          <SectionTitle title="Quién más llama — últimos 30 días" theme={theme}/>
          {topLlamantes.map((item, i) => (
            <Card key={i} theme={theme} style={{ marginBottom: SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: FONT.md, fontWeight: FONT.bold, color: theme.accent,
                  }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: FONT.md, fontWeight: FONT.semibold, color: theme.text,
                  }}>
                    {item.torre} · Apto {item.numero_apto}
                  </Text>
                  <Text style={{
                    fontSize: FONT.sm, color: theme.textHint,
                  }}>
                    {item.residente || 'Sin nombre'}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: theme.accentBg,
                  borderRadius: RADIUS.full,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}>
                  <Text style={{
                    color: theme.accent, fontFamily: 'monospace',
                    fontSize: FONT.md, fontWeight: FONT.bold,
                  }}>{item.total}x</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* ── Últimas llamadas ── */}
      <SectionTitle
        title="Últimas llamadas"
        theme={theme}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
            <Text style={{ color: theme.accent, fontSize: FONT.sm }}>Ver todo →</Text>
          </TouchableOpacity>
        }
      />
      {historial.length === 0 ? (
        <Text style={{
          color: theme.textHint, fontSize: FONT.sm, marginBottom: SPACING.md,
        }}>Sin llamadas registradas hoy</Text>
      ) : (
        historial.map(h => {
          const esEntrante = h.tipo_llamada?.includes('entrante')
          const icono = h.atendida
            ? (esEntrante ? '📥' : '📤')
            : '❌'
          return (
            <Card key={h.id} theme={theme} style={{ marginBottom: SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <Text style={{ fontSize: 22 }}>{icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: FONT.md, fontWeight: FONT.semibold, color: theme.text,
                  }}>
                    {h.torre || 'Desconocido'} · Apto {h.numero_apto || '—'}
                  </Text>
                  <Text style={{
                    fontSize: FONT.xs, color: theme.textHint, fontFamily: 'monospace',
                  }}>
                    {h.timestamp?.substring(11, 16)} ·{' '}
                    {esEntrante ? '📥 entrante' : '📤 saliente'}
                    {h.duracion_seg > 0 ? ` · ${h.duracion_seg}s` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          )
        })
      )}

      {/* Salir admin */}
      <TouchableOpacity
        onPress={() => { logoutAdmin(); navigation.replace('Portero') }}
        style={{
          marginTop: SPACING.lg,
          padding: SPACING.md,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.xl,
        }}
      >
        <Text style={{ color: theme.textHint, fontSize: FONT.md }}>
          🔓 Salir del modo administrador
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
