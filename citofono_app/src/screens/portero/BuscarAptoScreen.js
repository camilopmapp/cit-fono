// src/screens/portero/BuscarAptoScreen.js
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StatusBar,
} from 'react-native'
import { useApp } from '../../context/AppContext'
import { DB } from '../../db/database'
import { SPACING, RADIUS, FONT } from '../../theme'
import { ScreenHeader, BackBtn, EmptyState } from '../../components/common'

export default function BuscarAptoScreen({ route, navigation }) {
  const { theme } = useApp()
  const [query,   setQuery]   = useState(route.params?.query || '')
  const [todos,   setTodos]   = useState([])
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    DB.getApartamentos().then(data => {
      setTodos(data)
      if (query) filtrar(query, data)
    })
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  function filtrar(q, lista = todos) {
    if (!q.trim()) { setResults([]); return }
    const q2 = q.toLowerCase().trim()
    setResults(lista.filter(a =>
      a.numero.toLowerCase().includes(q2) ||
      (a.residente || '').toLowerCase().includes(q2) ||
      a.torre_nombre.toLowerCase().includes(q2)
    ))
  }

  function handleChange(text) {
    setQuery(text)
    filtrar(text)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface}/>

      <View style={{
        backgroundColor: theme.surface,
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
      }}>
        <BackBtn onPress={() => navigation.goBack()} theme={theme}/>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChange}
          placeholder="Buscar apartamento o residente..."
          placeholderTextColor={theme.placeholder}
          style={{
            flex: 1,
            backgroundColor: theme.inputBg,
            borderRadius: RADIUS.full,
            paddingHorizontal: SPACING.md,
            paddingVertical: 11,
            fontSize: FONT.md,
            color: theme.inputText,
            borderWidth: 1,
            borderColor: theme.border,
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {query.trim() && results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          subtitle={`No se encontraron apartamentos con "${query}"`}
          theme={theme}
        />
      ) : results.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <Text style={{ fontSize: 52 }}>🔍</Text>
          <Text style={{ color: theme.textHint, fontSize: FONT.md, marginTop: SPACING.md }}>
            Escribe para buscar
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{ padding: SPACING.md }}
          renderItem={({ item: a }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Llamar', { apto: a })}
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
              <View style={{
                width: 52, height: 52, borderRadius: RADIUS.md,
                backgroundColor: theme.accentBg,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: FONT.lg, fontWeight: FONT.bold, color: theme.accent,
                }}>{a.numero}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: FONT.md, fontWeight: FONT.semibold, color: theme.text,
                }}>{a.residente || `Apartamento ${a.numero}`}</Text>
                <Text style={{
                  fontSize: FONT.sm, color: theme.textHint, fontFamily: 'monospace',
                }}>{a.torre_nombre} · Piso {a.piso}</Text>
              </View>
              <Text style={{ color: theme.accent, fontSize: FONT.xl }}>📞</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}
