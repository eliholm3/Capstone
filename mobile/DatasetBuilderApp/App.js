import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './app/context/AuthContext';
import { DatasetProvider } from './app/context/DatasetContext';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import SwipeScreen from './app/screens/SwipeScreen';
import DatasetsScreen from './app/screens/DatasetsScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AppHeader from './app/components/AppHeader';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <AppHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#18181b',
            borderTopColor: '#27272a',
          },
          tabBarActiveTintColor: '#fafafa',
          tabBarInactiveTintColor: '#71717a',
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Datasets: focused ? 'layers' : 'layers-outline',
              Swipe: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
              Settings: focused ? 'settings' : 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Datasets" component={DatasetsScreen} />
        <Tab.Screen name="Swipe" component={SwipeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

function AppStack() {
  return (
    <DatasetProvider>
      <AppTabs />
    </DatasetProvider>
  );
}

function RootNavigator() {
  const { token, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#fafafa" />
      </View>
    );
  }

  return token ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#09090b" />
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
