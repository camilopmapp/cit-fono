// src/screens/admin/ImportarScreen.js
import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StatusBar, ActivityIndicator,
} from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import RNFS from 'react-native-fs'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import { BtnPrimary, BtnSecondary, ScreenHeader, BackBtn, Card } from '../../components/common'

// Columnas esperadas en el Excel
const COLUMNAS = [
  { key: 'torre',       label: 'Torre *',       ejemplo: 'Torre A' },
  { key: 'numero',      label: 'Apartamento *',  ejemplo: '403' },
  { key: 'piso',        label: 'Piso',           ejemplo: '4' },
  { key: 'residente',   label: 'Nombre Residente', ejemplo: 'García Ruiz' },
  { key: 'tel1',        label: 'Teléfono 1 *',   ejemplo: '3001234567' },
  { key: 'nombre_tel1', label: 'Nombre Tel 1',   ejemplo: 'Mamá' },
  { key: 'tel2',        label: 'Teléfono 2',     ejemplo: '3109876543' },
  { key: 'nombre_tel2', label: 'Nombre Tel 2',   ejemplo: 'Papá' },
  { key: 'tel3',        label: 'Teléfono 3',     ejemplo: '3205554433' },
  { key: 'nombre_tel3', label: 'Nombre Tel 3',   ejemplo: 'Oficina' },
]

export default function ImportarScreen({ navigation }) {
  const { theme } = useApp()
  const [fase,     setFase]     = useState('inicial') // inicial|preview|importando|resultado
  const [rows,     setRows]     = useState([])
  const [errores,  setErrores]  = useState([])
  const [resultado,setResultado]= useState(null)
  const [fileName, setFileName] = useState('')

  async function seleccionarArchivo() {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls, 'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      })
      setFileName(res.name)
      await procesarExcel(res.uri)
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Error', 'No se pudo abrir el archivo. Verifica que sea un .xlsx o .xls')
      }
    }
  }

  async function procesarExcel(uri) {
    try {
      // Leer archivo como base64
      const path = uri.startsWith('file://') ? uri.slice(7) : uri
      const base64 = await RNFS.readFile(path, 'base64')
      const workbook = XLSX.read(base64, { type: 'base64' })

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        Alert.alert('Error', 'El archivo Excel no tiene hojas o está corrupto.')
        return
      }

      // Primera hoja
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (data.length === 0) {
        Alert.alert('Error', 'El archivo está vacío o no tiene datos en la primera hoja')
        return
      }

      // Mapear columnas — buscar por nombre de columna insensible a mayúsculas
      const mapped = data.map((fila, idx) => {
        const normalizar = (obj) => {
          const n = {}
          Object.keys(obj).forEach(k => {
            const keyLimpia = k.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
              .trim()
            n[keyLimpia] = obj[k]
          })
          return n
        }
        const f = normalizar(fila)

        return {
          _fila: idx + 2, // +2 porque fila 1 es header
          torre:       f['torre'] || f['bloque'] || f['torre/bloque'] || f['edificio'] || '',
          numero:      f['apartamento'] || f['apto'] || f['numero'] || f['nro'] || '',
          piso:        f['piso'] || '',
          residente:   f['nombre residente'] || f['residente'] || f['nombre'] || f['inquilino'] || '',
          tel1:        String(f['telefono 1'] || f['tel 1'] || f['tel1'] || f['celular 1'] || f['celular'] || f['telefono'] || '').trim(),
          nombre_tel1: f['nombre tel 1'] || f['nombre tel1'] || 'Principal',
          tel2:        String(f['telefono 2'] || f['tel 2'] || f['tel2'] || f['celular 2'] || '').trim(),
          nombre_tel2: f['nombre tel 2'] || f['nombre tel2'] || 'Alternativo',
          tel3:        String(f['telefono 3'] || f['tel 3'] || f['tel3'] || f['celular 3'] || '').trim(),
          nombre_tel3: f['nombre tel 3'] || f['nombre tel3'] || 'Otro',
        }
      })

      // Validar preview
      const TEL_REGEX = /^\d{7,15}$/
      const errs = []
      const validos = []
      mapped.forEach(r => {
        const t = String(r.torre).trim()
        const n = String(r.numero).trim()
        const tel = String(r.tel1).trim()

        if (!t) {
          errs.push({ fila: r._fila, msg: 'Torre/Bloque faltante' })
        } else if (!n) {
          errs.push({ fila: r._fila, msg: 'Número de apto faltante' })
        } else if (!tel || tel === 'undefined' || tel === 'null') {
          errs.push({ fila: r._fila, msg: 'Teléfono principal faltante' })
        } else if (!TEL_REGEX.test(tel)) {
          errs.push({ fila: r._fila, msg: `Teléfono inválido: "${tel}" (solo dígitos, 7-15)` })
        } else {
          validos.push(r)
        }
      })

      setRows(validos)
      setErrores(errs)
      setFase('preview')
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar el archivo. Verifica el formato.')
    }
  }

  async function confirmarImportacion(modo) {
    setFase('importando')
    const res = await DB.importarResidentes(rows, modo)
    setResultado(res)
    setFase('resultado')
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>
      <ScreenHeader
        theme={theme}
        title="⬆️ Importar desde Excel"
        left={<BackBtn onPress={() => navigation.goBack()} theme={theme}/>}
      />

      <ScrollView contentContainerStyle={{ padding: SPACING.md }}>

        {/* ── FASE: INICIAL ── */}
        {fase === 'inicial' && (
          <>
            {/* Instrucciones */}
            <Card theme={theme} style={{ marginBottom: SPACING.md }}>
              <Text style={{
                fontSize: FONT.md, fontWeight: FONT.semibold,
                color: theme.text, marginBottom: SPACING.sm,
              }}>📋 Formato del archivo Excel</Text>
              <Text style={{
                fontSize: FONT.sm, color: theme.textHint, marginBottom: SPACING.md,
              }}>
                La primera fila debe tener los nombres de las columnas.
                Los campos con * son obligatorios.
              </Text>

              {COLUMNAS.map(c => (
                <View key={c.key} style={{
                  flexDirection: 'row', gap: SPACING.md,
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}>
                  <Text style={{
                    flex: 1, fontSize: FONT.sm,
                    color: c.key === 'torre' || c.key === 'numero' || c.key === 'tel1'
                      ? theme.accent : theme.textSub,
                    fontWeight: c.key === 'torre' || c.key === 'numero' || c.key === 'tel1'
                      ? FONT.semibold : FONT.regular,
                  }}>{c.label}</Text>
                  <Text style={{
                    flex: 1, fontSize: FONT.sm,
                    color: theme.textHint, fontFamily: 'monospace',
                  }}>{c.ejemplo}</Text>
                </View>
              ))}
            </Card>

            <Card theme={theme} style={{ marginBottom: SPACING.md, backgroundColor: theme.amberBg, borderColor: theme.amber + '40' }}>
              <Text style={{ fontSize: FONT.sm, color: theme.amber }}>
                💡 Los teléfonos pueden ser con o sin +57. Si ya existe el apartamento, se actualizará con los nuevos datos.
              </Text>
            </Card>

            <BtnPrimary
              label="📁 Seleccionar archivo Excel"
              onPress={seleccionarArchivo}
              theme={theme}
              icon="📊"
            />
          </>
        )}

        {/* ── FASE: PREVIEW ── */}
        {fase === 'preview' && (
          <>
            <Card theme={theme} style={{ marginBottom: SPACING.md }}>
              <Text style={{
                fontSize: FONT.lg, fontWeight: FONT.bold,
                color: theme.text, marginBottom: SPACING.sm,
              }}>📊 Vista previa — {fileName}</Text>

              <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
                <View style={{
                  flex: 1, alignItems: 'center', padding: SPACING.md,
                  backgroundColor: theme.greenBg, borderRadius: RADIUS.md,
                }}>
                  <Text style={{
                    fontSize: FONT.xxxl, fontWeight: FONT.bold, color: theme.green,
                  }}>{rows.length}</Text>
                  <Text style={{ fontSize: FONT.xs, color: theme.green, fontFamily: 'monospace' }}>
                    VÁLIDOS
                  </Text>
                </View>
                <View style={{
                  flex: 1, alignItems: 'center', padding: SPACING.md,
                  backgroundColor: errores.length ? theme.redBg : theme.greenBg,
                  borderRadius: RADIUS.md,
                }}>
                  <Text style={{
                    fontSize: FONT.xxxl, fontWeight: FONT.bold,
                    color: errores.length ? theme.red : theme.green,
                  }}>{errores.length}</Text>
                  <Text style={{
                    fontSize: FONT.xs,
                    color: errores.length ? theme.red : theme.green,
                    fontFamily: 'monospace',
                  }}>ERRORES</Text>
                </View>
              </View>

              {/* Errores */}
              {errores.length > 0 && (
                <>
                  <Text style={{
                    fontSize: FONT.sm, color: theme.red,
                    fontWeight: FONT.semibold, marginBottom: SPACING.sm,
                  }}>⚠️ Filas con error (se omitirán):</Text>
                  {errores.slice(0, 5).map((e, i) => (
                    <Text key={i} style={{
                      fontSize: FONT.xs, color: theme.red,
                      fontFamily: 'monospace', marginBottom: 2,
                    }}>Fila {e.fila}: {e.msg}</Text>
                  ))}
                  {errores.length > 5 && (
                    <Text style={{ fontSize: FONT.xs, color: theme.textHint }}>
                      ...y {errores.length - 5} errores más
                    </Text>
                  )}
                </>
              )}
            </Card>

            {/* Preview de los primeros 5 registros */}
            <Text style={{
              fontSize: FONT.xs, color: theme.textHint,
              fontFamily: 'monospace', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: SPACING.sm,
            }}>Primeros registros:</Text>
            {rows.slice(0, 5).map((r, i) => (
              <Card key={i} theme={theme} style={{ marginBottom: SPACING.sm }}>
                <Text style={{
                  fontSize: FONT.sm, fontWeight: FONT.semibold,
                  color: theme.text,
                }}>
                  {r.torre} · Apto {r.numero} · Piso {r.piso || '?'}
                </Text>
                <Text style={{
                  fontSize: FONT.xs, color: theme.textHint, marginTop: 2,
                }}>
                  {r.residente || 'Sin nombre'} · {r.tel1}
                  {r.tel2 ? ` · ${r.tel2}` : ''}
                </Text>
              </Card>
            ))}
            {rows.length > 5 && (
              <Text style={{
                fontSize: FONT.sm, color: theme.textHint,
                textAlign: 'center', marginBottom: SPACING.md,
              }}>...y {rows.length - 5} residentes más</Text>
            )}

            {/* Botones de acción */}
            {rows.length > 0 && (
              <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
                <BtnPrimary
                  label={`✅ Importar ${rows.length} residentes (actualizar si existe)`}
                  onPress={() => confirmarImportacion('merge')}
                  theme={theme}
                />
                <BtnSecondary
                  label="Solo agregar nuevos (no actualizar existentes)"
                  onPress={() => confirmarImportacion('only_new')}
                  theme={theme}
                />
                <BtnSecondary
                  label="← Seleccionar otro archivo"
                  onPress={() => { setFase('inicial'); setRows([]); setErrores([]) }}
                  theme={theme}
                />
              </View>
            )}
          </>
        )}

        {/* ── FASE: IMPORTANDO ── */}
        {fase === 'importando' && (
          <View style={{ alignItems: 'center', padding: SPACING.xl * 2 }}>
            <ActivityIndicator size="large" color={theme.accent}/>
            <Text style={{
              fontSize: FONT.lg, color: theme.text,
              marginTop: SPACING.lg, textAlign: 'center',
            }}>Importando residentes...</Text>
            <Text style={{ fontSize: FONT.sm, color: theme.textHint, marginTop: SPACING.sm }}>
              Esto puede tomar unos segundos
            </Text>
          </View>
        )}

        {/* ── FASE: RESULTADO ── */}
        {fase === 'resultado' && resultado && (
          <>
            <Card theme={theme} style={{
              marginBottom: SPACING.md,
              backgroundColor: resultado.errores.length === 0 ? theme.greenBg : theme.amberBg,
              borderColor: resultado.errores.length === 0 ? theme.green + '40' : theme.amber + '40',
            }}>
              <Text style={{
                fontSize: 48, textAlign: 'center', marginBottom: SPACING.md,
              }}>{resultado.errores.length === 0 ? '✅' : '⚠️'}</Text>
              <Text style={{
                fontSize: FONT.xl, fontWeight: FONT.bold, textAlign: 'center',
                color: theme.text, marginBottom: SPACING.sm,
              }}>Importación completada</Text>
              <Text style={{
                fontSize: FONT.lg, textAlign: 'center',
                color: theme.green, fontWeight: FONT.semibold,
              }}>
                {resultado.importados} residentes importados
              </Text>
              {resultado.errores.length > 0 && (
                <Text style={{
                  fontSize: FONT.md, textAlign: 'center',
                  color: theme.amber, marginTop: 4,
                }}>
                  {resultado.errores.length} filas con error (omitidas)
                </Text>
              )}
            </Card>

            <BtnPrimary
              label="✅ Ver residentes"
              onPress={() => navigation.goBack()}
              theme={theme}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}
