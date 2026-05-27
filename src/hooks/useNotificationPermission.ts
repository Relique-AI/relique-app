import { useState, useCallback, useRef } from 'react';
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
  const onCompleteRef = useRef<(() => void) | null>(null);

  const promptIfNeeded = useCallback(async (
    context: NotificationPromptContext,
    onComplete?: () => void,
  ): Promise<boolean> => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return false;

    if (status === 'denied') {
      const settingsShown = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsShown) return false;
      await AsyncStorage.setItem(SETTINGS_KEY, 'true');
      onCompleteRef.current = onComplete ?? null;
      setIsDenied(true);
      setPromptContext(context);
      return true;
    }

    // undetermined — show once per install
    const alreadyShown = await AsyncStorage.getItem(STORAGE_KEY);
    if (alreadyShown) return false;
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    onCompleteRef.current = onComplete ?? null;
    setIsDenied(false);
    setPromptContext(context);
    return true;
  }, []);

  const onAccept = useCallback(async () => {
    setPromptContext(null);
    const cb = onCompleteRef.current;
    onCompleteRef.current = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5B82E',
      });
    }

    // Toujours tenter le dialogue natif d'abord (Android retourne 'denied'
    // avant même la première demande — requestPermissionsAsync affiche le vrai dialogue)
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      // Dialogue natif refusé et Android ne peut plus le redemander → réglages
      if (!canAskAgain) Linking.openSettings();
      return;
    }

    cb?.();
    if (!user) return;

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
    setIsDenied(false);
    const cb = onCompleteRef.current;
    onCompleteRef.current = null;
    cb?.();
  }, []);

  return { promptContext, isDenied, promptIfNeeded, onAccept, onDismiss };
}
