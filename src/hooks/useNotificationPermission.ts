import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'push_prompt_shown';
const SETTINGS_KEY = 'push_settings_prompt_shown';

export type NotificationPromptContext = 'message' | 'offer' | 'question' | 'purchase' | 'listing';

export function useNotificationPermission() {
  const { user } = useAuth();
  const [promptContext, setPromptContext] = useState<NotificationPromptContext | null>(null);
  const [isDenied, setIsDenied] = useState(false);

  const promptIfNeeded = useCallback(async (context: NotificationPromptContext) => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return;

    if (status === 'denied') {
      const settingsShown = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsShown) return;
      await AsyncStorage.setItem(SETTINGS_KEY, 'true');
      setIsDenied(true);
      setPromptContext(context);
      return;
    }

    // undetermined — show once per install
    const alreadyShown = await AsyncStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setIsDenied(false);
    setPromptContext(context);
  }, []);

  const onAccept = useCallback(async () => {
    setPromptContext(null);

    if (isDenied) {
      Linking.openSettings();
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5B82E',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted' || !user) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    if (!token) return;

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  }, [isDenied, user]);

  const onDismiss = useCallback(() => {
    setPromptContext(null);
    setIsDenied(false);
  }, []);

  return { promptContext, isDenied, promptIfNeeded, onAccept, onDismiss };
}
