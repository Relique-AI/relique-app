import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: 'https://6cdab45561f2c28fb4371cc3f789fe53@o4511387816165376.ingest.de.sentry.io/4511387820163152',
  tracesSampleRate: 0.2,
  environment: __DEV__ ? 'development' : 'production',
});
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import { useEffect, useCallback, useRef, Component } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { supabase } from './src/services/supabase';
import { colors } from './src/theme';

class AppErrorBoundary extends Component<{ children: any }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0B0907', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
          <Text style={{ fontSize: 40, color: '#F5B82E' }}>✦</Text>
          <Text style={{ fontSize: 20, color: '#fff', fontWeight: '600', textAlign: 'center' }}>
            Une erreur inattendue s'est produite
          </Text>
          <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 }}>
            Redémarre l'application pour continuer.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: '#F5B82E', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 }}
          >
            <Text style={{ color: '#0B0907', fontWeight: '600', fontSize: 15 }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function DeepLinkHandler() {
  const handleUrl = useCallback(async (url: string) => {
    const codeMatch = url.match(/[?&]code=([^&]+)/);
    const code = codeMatch?.[1];
    if (code) {
      await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
    }
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [handleUrl]);

  return null;
}

function AppWithNotifications() {
  usePushNotifications();
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
      <StatusBar style="light" />
      <DeepLinkHandler />
      <AppNavigator />
    </StripeProvider>
  );
}

function NavigationWithTracking() {
  const posthog = usePostHog();
  const routeNameRef = useRef<string | undefined>();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const currentRoute = navigationRef.getCurrentRoute();
        const currentRouteName = currentRoute?.name;
        if (currentRouteName && routeNameRef.current !== currentRouteName) {
          posthog?.screen(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <AppWithNotifications />
    </NavigationContainer>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <PostHogProvider
            apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
            options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST, flushAt: 1, flushInterval: 0 }}
            autocapture={{ captureScreens: false }}
          >
            <AuthProvider>
              <NavigationWithTracking />
            </AuthProvider>
          </PostHogProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
