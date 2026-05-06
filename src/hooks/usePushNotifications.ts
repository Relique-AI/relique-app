import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { navigate, navigationRef } from '../navigation/navigationRef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function doNavigate(data: Record<string, any>) {
  if (data?.type === 'message' && data?.listing_id && data?.sender_id) {
    navigate('Messages', {
      screen: 'Chat',
      params: {
        listing_id: data.listing_id,
        receiver_id: data.sender_id,
        listing_name: data.listing_name ?? '',
      },
    });
  } else if (data?.type === 'message') {
    navigate('Messages');
  } else if (data?.type === 'question' && data?.listing_id) {
    navigate('Profil', {
      screen: 'Listing',
      params: { id: data.listing_id },
    });
  } else if ((data?.type === 'question_answer') && data?.listing_id) {
    navigate('Marché', {
      screen: 'Listing',
      params: { id: data.listing_id },
    });
  } else if (data?.type === 'new_listing' && data?.listing_id) {
    navigate('Marché', {
      screen: 'Listing',
      params: { id: data.listing_id },
    });
  } else if (data?.type === 'referral') {
    navigate('Profil');
  }
}

function handleNotificationData(data: Record<string, any>) {
  // Retry until navigation is ready (app may not be mounted yet after cold start)
  if (navigationRef.isReady()) {
    doNavigate(data);
  } else {
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (navigationRef.isReady()) {
        clearInterval(interval);
        doNavigate(data);
      } else if (tries > 20) {
        clearInterval(interval);
      }
    }, 300);
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications();

    // Gérer l'ouverture depuis une notif quand l'app était fermée
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, any>;
      handleNotificationData(data);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((_n) => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      handleNotificationData(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F5B82E',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    const token = tokenData.data;
    if (!token || !user) return;

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  };
}
