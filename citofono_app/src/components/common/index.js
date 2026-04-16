// src/components/common/index.js
// Componentes reutilizables en toda la app
import React from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { SPACING, RADIUS, FONT, SHADOW } from '../../theme'

// ── Botón principal ────────────────────────────────────────────
export function BtnPrimary({ label, onPress, disabled, loading, icon, style, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[{
        backgroundColor: disabled ? theme.surface3 : theme.btnPrimary,
        borderRadius: RADIUS.md,
        paddingVertical: 14,
        paddingHorizontal: SPACING.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
      }, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small"/>
        : <>
            {icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
            <Text style={{
              color: theme.btnPrimaryTxt,
              fontSize: FONT.md,
              fontWeight: FONT.bold,
            }}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  )
}

// ── Botón secundario ───────────────────────────────────────────
export function BtnSecondary({ label, onPress, icon, style, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        backgroundColor: theme.btnSecondary,
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: theme.border,
      }, style]}
      activeOpacity={0.7}
    >
      {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
      <Text style={{
        color: theme.btnSecTxt,
        fontSize: FONT.md,
        fontWeight: FONT.medium,
      }}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Botón peligro ──────────────────────────────────────────────
export function BtnDanger({ label, onPress, icon, style, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        backgroundColor: theme.btnDanger,
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: theme.red + '40',
      }, style]}
      activeOpacity={0.7}
    >
      {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
      <Text style={{
        color: theme.btnDangerTxt,
        fontSize: FONT.md,
        fontWeight: FONT.medium,
      }}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── Input de texto ─────────────────────────────────────────────
export function Input({
  label, value, onChangeText, placeholder,
  keyboardType, secureTextEntry, multiline,
  editable = true, style, theme, maxLength,
  autoCapitalize = 'sentences',
}) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && (
        <Text style={{
          fontSize: FONT.xs,
          color: theme.textHint,
          fontWeight: FONT.medium,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontFamily: 'monospace',
        }}>{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        editable={editable}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[{
          backgroundColor: theme.inputBg,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          paddingVertical: 12,
          fontSize: FONT.md,
          color: theme.inputText,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }, style]}
      />
    </View>
  )
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style, theme, onPress }) {
  const content = (
    <View style={[{
      backgroundColor: theme.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...SHADOW(theme),
    }, style]}>
      {children}
    </View>
  )
  if (onPress) return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      {content}
    </TouchableOpacity>
  )
  return content
}

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ label, color, bgColor, style }) {
  return (
    <View style={[{
      backgroundColor: bgColor,
      borderRadius: RADIUS.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
    }, style]}>
      <Text style={{
        color, fontSize: FONT.xs,
        fontWeight: FONT.semibold,
        fontFamily: 'monospace',
      }}>{label}</Text>
    </View>
  )
}

// ── Separador ──────────────────────────────────────────────────
export function Divider({ theme, style }) {
  return <View style={[{ height: 1, backgroundColor: theme.border }, style]}/>
}

// ── Título de sección ──────────────────────────────────────────
export function SectionTitle({ title, theme, right }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm, marginTop: SPACING.md,
    }}>
      <Text style={{
        fontSize: FONT.xs, color: theme.textHint,
        fontWeight: FONT.semibold, textTransform: 'uppercase',
        letterSpacing: 1, fontFamily: 'monospace',
      }}>{title}</Text>
      {right}
    </View>
  )
}

// ── Loading screen ─────────────────────────────────────────────
export function LoadingScreen({ theme }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
                   backgroundColor: theme.bg }}>
      <ActivityIndicator size="large" color={theme.accent}/>
    </View>
  )
}

// ── Toggle switch ──────────────────────────────────────────────
export function Toggle({ value, onValueChange, theme }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={{
        width: 52, height: 28, borderRadius: 14,
        backgroundColor: value ? theme.accent : theme.surface3,
        justifyContent: 'center',
        paddingHorizontal: 3,
      }}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#fff',
        alignSelf: value ? 'flex-end' : 'flex-start',
      }}/>
    </TouchableOpacity>
  )
}

// ── Fila de lista táctil ───────────────────────────────────────
export function ListRow({ left, center, right, onPress, theme, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        gap: SPACING.md,
      }, style]}
      activeOpacity={0.7}
    >
      {left}
      <View style={{ flex: 1 }}>{center}</View>
      {right}
    </TouchableOpacity>
  )
}

// ── Avatar circular con letra ──────────────────────────────────
export function Avatar({ text, size = 44, color, bgColor }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size/2,
      backgroundColor: bgColor,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{
        color, fontSize: size * 0.38,
        fontWeight: FONT.bold,
      }}>{text?.charAt(0)?.toUpperCase() || '?'}</Text>
    </View>
  )
}

// ── Contador de KPI ────────────────────────────────────────────
export function KpiCard({ value, label, color, bgColor, theme, icon }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: bgColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: color + '30',
    }}>
      {icon && <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>}
      <Text style={{
        fontSize: FONT.xxxl, fontWeight: FONT.bold,
        color, lineHeight: FONT.xxxl * 1.1,
      }}>{value}</Text>
      <Text style={{
        fontSize: FONT.xs, color: theme.textHint,
        textTransform: 'uppercase', letterSpacing: 0.8,
        fontFamily: 'monospace', marginTop: 2,
        textAlign: 'center',
      }}>{label}</Text>
    </View>
  )
}

// ── Header de pantalla ─────────────────────────────────────────
export function ScreenHeader({ title, subtitle, right, left, theme }) {
  return (
    <View style={{
      backgroundColor: theme.surface,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    }}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: FONT.lg, fontWeight: FONT.bold,
          color: theme.text,
        }}>{title}</Text>
        {subtitle && (
          <Text style={{
            fontSize: FONT.sm, color: theme.textHint,
            fontFamily: 'monospace',
          }}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  )
}

// ── Botón de regreso ───────────────────────────────────────────
export function BackBtn({ onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.surface2,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 18, color: theme.text }}>←</Text>
    </TouchableOpacity>
  )
}

// ── Empty state ────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, theme }) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: SPACING.xl,
    }}>
      <Text style={{ fontSize: 52, marginBottom: SPACING.md }}>{icon}</Text>
      <Text style={{
        fontSize: FONT.lg, fontWeight: FONT.semibold,
        color: theme.text, textAlign: 'center', marginBottom: SPACING.sm,
      }}>{title}</Text>
      {subtitle && (
        <Text style={{
          fontSize: FONT.md, color: theme.textHint,
          textAlign: 'center',
        }}>{subtitle}</Text>
      )}
    </View>
  )
}
