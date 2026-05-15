import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'push_prompt_shown';

export type NotificationPromptContext = 'message' | 'offer' | 'question' | 'purchase' | 'listing';

export function useNotificationPermission() {
  const { user } = useAuth();
  const [promptContext, setPromptContext] = useState<NotificationPromptContext | null>(null);

  const promptIfNeeded = useCallback(async (context: NotificationPromptContext) => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return;

    const alreadyShown = await AsyncStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return;

    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setPromptContext(context);
  }, []);

  const onAccept = useCallback(async () => {
    setPromptContext(null);

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
  }, [user]);

  const onDismiss = useCallback(() => {
    setPromptContext(null);
  }, []);

  return { promptContext, promptIfNeeded, onAccept, onDismiss };
}
