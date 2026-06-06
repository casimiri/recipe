import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { AuthProvider } from '../store/auth';
import { AppStateProvider } from '../store/AppState';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { t, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="cookbook/[id]" />
        <Stack.Screen name="cook/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="cook-done" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="import" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkout" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jakarta_400Regular: PlusJakartaSans_400Regular,
    Jakarta_500Medium: PlusJakartaSans_500Medium,
    Jakarta_600SemiBold: PlusJakartaSans_600SemiBold,
    Jakarta_700Bold: PlusJakartaSans_700Bold,
    Jakarta_800ExtraBold: PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppStateProvider>
              <RootStack />
            </AppStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
