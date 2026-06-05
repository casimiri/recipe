import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../store/auth';

export const ONBOARDED_KEY = 'rs:onboarded';

export default function Gate() {
  const { t } = useTheme();
  const { loading, configured, session } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setOnboarded(v === '1'));
  }, []);

  if (onboarded === null || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;
  // Require auth only when a real backend is configured.
  if (configured && !session) return <Redirect href="/auth" />;
  return <Redirect href="/(tabs)" />;
}
