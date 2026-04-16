// App.js — v2 completo
import React, { useEffect } from 'react'
import { NavigationContainer }  from '@react-navigation/native'
import { SafeAreaProvider }     from 'react-native-safe-area-context'
import { Platform, BackHandler, StatusBar, LogBox } from 'react-native'
import KeepAwake                from 'react-native-keep-awake'
import { AppProvider, useApp }  from './src/context/AppContext'
import AppNavigator             from './src/navigation'
import { LoadingScreen }        from './src/components/common'
import { solicitarPermisos }    from './src/utils/permissions'
import { navigationRef }        from './src/navigation/navigationService'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Cannot record touch end without a touch start',
])

function KioskoManager() {
  const { isAdmin, config } = useApp()

  useEffect(() => {
    // Bloquear botón atrás si no es admin
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isAdmin) {
        // Podríamos mostrar un mensaje o vibrar
        return true // bloquea la acción
      }
      return false
    })
    return () => handler.remove()
  }, [isAdmin])

  useEffect(() => {
    KeepAwake.activate()
    return () => KeepAwake.deactivate()
  }, [])

  return null
}

function Root() {
  const { dbReady, theme } = useApp()

  useEffect(() => {
    solicitarPermisos()
  }, [])

  if (!dbReady) return <LoadingScreen theme={theme}/>

  return (
    <>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.bg}
        translucent={false}
      />
      <KioskoManager/>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          dark:   theme.mode === 'dark',
          colors: {
            primary:      theme.accent,
            background:   theme.bg,
            card:         theme.surface,
            text:         theme.text,
            border:       theme.border,
            notification: theme.accent,
          },
        }}
      >
        <AppNavigator/>
      </NavigationContainer>
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root/>
      </AppProvider>
    </SafeAreaProvider>
  )
}
