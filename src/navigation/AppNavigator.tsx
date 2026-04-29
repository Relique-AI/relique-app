import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts } from '../theme';
import {
  RootStackParamList,
  MarketStackParamList,
  BrowseStackParamList,
  ProfileStackParamList,
  WalletStackParamList,
  TabParamList,
} from '../types';

import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SellScreen } from '../screens/SellScreen';
import { MarketScreen } from '../screens/MarketScreen';
import { ListingScreen } from '../screens/ListingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { BrowseListingsScreen } from '../screens/BrowseListingsScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { EditListingScreen } from '../screens/EditListingScreen';

// ─── Stacks ──────────────────────────────────────────────────────────────────

const ScannerStack = createStackNavigator<RootStackParamList>();
function ScannerNavigator() {
  return (
    <ScannerStack.Navigator screenOptions={{ headerShown: false }}>
      <ScannerStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />
      <ScannerStack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter }}
      />
      <ScannerStack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ScannerStack.Screen
        name="Loading"
        component={LoadingScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          gestureEnabled: false,
        }}
      />
      <ScannerStack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          gestureEnabled: false,
        }}
      />
      <ScannerStack.Screen
        name="Sell"
        component={SellScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </ScannerStack.Navigator>
  );
}

const BrowseStack = createStackNavigator<BrowseStackParamList>();
function BrowseNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen name="Browse" component={BrowseScreen} />
      <BrowseStack.Screen
        name="BrowseListings"
        component={BrowseListingsScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <BrowseStack.Screen
        name="Listing"
        component={ListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </BrowseStack.Navigator>
  );
}

const MarketStack = createStackNavigator<MarketStackParamList>();
function MarketNavigator() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="Market" component={MarketScreen} />
      <MarketStack.Screen
        name="Listing"
        component={ListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <MarketStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <MarketStack.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </MarketStack.Navigator>
  );
}

const WalletStack = createStackNavigator<WalletStackParamList>();
function WalletNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="Wallet" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

const ProfileStack = createStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Listing"
        component={ListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </ProfileStack.Navigator>
  );
}

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'rgba(201,168,76,0.15)',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemiBold,
          fontSize: 11,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Scanner: { active: 'camera', inactive: 'camera-outline' },
            Parcourir: { active: 'grid', inactive: 'grid-outline' },
            Marché: { active: 'storefront', inactive: 'storefront-outline' },
            Portefeuille: { active: 'wallet', inactive: 'wallet-outline' },
            Profil: { active: 'person', inactive: 'person-outline' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={(focused ? icon.active : icon.inactive) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Scanner" component={ScannerNavigator} />
      <Tab.Screen name="Parcourir" component={BrowseNavigator} />
      <Tab.Screen name="Marché" component={MarketNavigator} />
      <Tab.Screen name="Portefeuille" component={WalletNavigator} />
      <Tab.Screen name="Profil" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

// ─── Root (auth gate) ────────────────────────────────────────────────────────

const Root = createStackNavigator();
export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false, animation: 'none' } as any}>
      {!user ? (
        <Root.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Root.Screen name="Main" component={MainTabs} />
      )}
    </Root.Navigator>
  );
}
