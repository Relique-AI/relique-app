import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { colors } from './src/theme';

function AppWithNotifications() {
  usePushNotifications();
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
      <StatusBar style="light" />
      <AppNavigator />
    </StripeProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <AppWithNotifications />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
