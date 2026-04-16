// src/navigation/index.js — v2 completo
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useApp } from '../context/AppContext'

import TorresScreen               from '../screens/portero/TorresScreenV2'
import ApartamentosScreen         from '../screens/portero/ApartamentosScreen'
import LlamarScreen               from '../screens/portero/LlamarScreen'
import BuscarAptoScreen           from '../screens/portero/BuscarAptoScreen'
import LlamadaEntranteScreen      from '../screens/portero/LlamadaEntranteScreen'
import NuevoResidenteRapidoScreen from '../screens/portero/NuevoResidenteRapidoScreen'
import NotasScreen                from '../screens/portero/NotasScreen'
import AdminLoginScreen           from '../screens/admin/AdminLoginScreen'
import DashboardScreen            from '../screens/admin/DashboardScreen'
import ResidentesScreen           from '../screens/admin/ResidentesScreen'
import TorresAdminScreen          from '../screens/admin/TorresAdminScreen'
import ConfigScreen               from '../screens/admin/ConfigScreen'
import HistorialScreen            from '../screens/admin/HistorialScreen'
import ImportarScreen             from '../screens/admin/ImportarScreen'

const Stack = createStackNavigator()
const Tab   = createBottomTabNavigator()

function PorteroStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Torres"               component={TorresScreen}/>
      <Stack.Screen name="Apartamentos"         component={ApartamentosScreen}/>
      <Stack.Screen name="Llamar"               component={LlamarScreen}/>
      <Stack.Screen name="BuscarApto"           component={BuscarAptoScreen}/>
      <Stack.Screen name="Notas"                component={NotasScreen}/>
      <Stack.Screen name="LlamadaEntrante"      component={LlamadaEntranteScreen}
        options={{ presentation: 'modal', gestureEnabled: false }}/>
      <Stack.Screen name="NuevoResidenteRapido" component={NuevoResidenteRapidoScreen}
        options={{ presentation: 'modal' }}/>
      <Stack.Screen name="AdminLogin"           component={AdminLoginScreen}/>
    </Stack.Navigator>
  )
}

function AdminTabs() {
  const { theme } = useApp()
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.navBg,
        borderTopColor: theme.navBorder,
        borderTopWidth: 1,
        height: 62, paddingBottom: 10,
      },
      tabBarActiveTintColor:   theme.navActive,
      tabBarInactiveTintColor: theme.navInactive,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tab.Screen name="Dashboard"      component={DashboardScreen}
        options={{ tabBarLabel:'Inicio',
          tabBarIcon:({color})=><Text style={{fontSize:22,color}}>📊</Text>}}/>
      <Tab.Screen name="AdminResidentes" component={ResidentesScreen}
        options={{ tabBarLabel:'Residentes',
          tabBarIcon:({color})=><Text style={{fontSize:22,color}}>🏠</Text>}}/>
      <Tab.Screen name="AdminTorres"    component={TorresAdminScreen}
        options={{ tabBarLabel:'Torres',
          tabBarIcon:({color})=><Text style={{fontSize:22,color}}>🏢</Text>}}/>
      <Tab.Screen name="Historial"      component={HistorialScreen}
        options={{ tabBarLabel:'Historial',
          tabBarIcon:({color})=><Text style={{fontSize:22,color}}>📋</Text>}}/>
      <Tab.Screen name="AdminConfig"    component={ConfigScreen}
        options={{ tabBarLabel:'Config',
          tabBarIcon:({color})=><Text style={{fontSize:22,color}}>⚙️</Text>}}/>
    </Tab.Navigator>
  )
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs}/>
      <Stack.Screen name="Importar"  component={ImportarScreen}
        options={{ presentation: 'modal' }}/>
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Portero"    component={PorteroStack}/>
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen}/>
      <Stack.Screen name="AdminMain"  component={AdminStack}/>
    </Stack.Navigator>
  )
}
