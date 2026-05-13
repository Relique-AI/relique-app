import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors, fonts } from '../theme';
import {
  RootStackParamList,
  MarketStackParamList,
  BrowseStackParamList,
  ProfileStackParamList,
  MessagesStackParamList,
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
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { EditListingScreen } from '../screens/EditListingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { StripeOnboardingScreen } from '../screens/StripeOnboardingScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';

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
      <BrowseStack.Screen
        name="EditListing"
        component={EditListingScreen}
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
        name="EditListing"
        component={EditListingScreen}
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

const MessagesStack = createStackNavigator<MessagesStackParamList>();
function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="Inbox" component={InboxScreen} />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <MessagesStack.Screen
        name="Listing"
        component={ListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <MessagesStack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </MessagesStack.Navigator>
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
        name="Chat"
        component={ChatScreen}
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
      <ProfileStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
      <ProfileStack.Screen
        name="StripeOnboarding"
        component={StripeOnboardingScreen}
        options={{ cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS }}
      />
    </ProfileStack.Navigator>
  );
}

// ─── Guest gate screen ───────────────────────────────────────────────────────

function GuestGateScreen() {
  const { exitGuestMode } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <Text style={{ fontSize: 48, color: colors.primary }}>✦</Text>
      <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.textPrimary, textAlign: 'center' }}>
        Connexion requise
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 23 }}>
        Créez un compte gratuit pour vendre vos objets, discuter avec les vendeurs et accéder à toutes les fonctionnalités.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 40, marginTop: 8 }}
        onPress={exitGuestMode}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background }}>Se connecter / Créer un compte</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const [questionBadge, setQuestionBadge] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false);
    setUnreadCount(count ?? 0);
  }, [user]);

  const fetchQuestionBadge = useCallback(async () => {
    if (!user || isGuest) { setQuestionBadge(0); return; }
    const { count } = await supabase
      .from('listing_questions')
      .select('id, listings!inner(seller_id)', { count: 'exact', head: true })
      .eq('listings.seller_id', user.id)
      .is('answer', null);
    setQuestionBadge(count ?? 0);
  }, [user, isGuest]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    fetchQuestionBadge();
    const msgChannel = supabase
      .channel(`inbox-badge-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchUnreadCount)
      .subscribe();
    const qChannel = supabase
      .channel(`questions-badge-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listing_questions' }, fetchQuestionBadge)
      .subscribe();
    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(qChannel);
    };
  }, [user, fetchUnreadCount, fetchQuestionBadge]);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'rgba(245,184,46,0.15)',
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
            Messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
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
      <Tab.Screen
        name="Messages"
        component={isGuest ? GuestGateScreen : MessagesNavigator}
        options={{ tabBarBadge: !isGuest && unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen
        name="Profil"
        component={isGuest ? GuestGateScreen : ProfileNavigator}
        options={{ tabBarBadge: !isGuest && questionBadge > 0 ? questionBadge : undefined }}
        listeners={{ focus: () => fetchQuestionBadge() }}
      />
    </Tab.Navigator>
  );
}

// ─── Root (auth gate) ────────────────────────────────────────────────────────

const Root = createStackNavigator();
export function AppNavigator() {
  const { user, loading, profileLoading, hasUsername, isGuest, isRecovery } = useAuth();

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
      {isRecovery ? (
        <Root.Screen name="ResetPassword" component={ResetPasswordScreen} />
      ) : !user && !isGuest ? (
        <Root.Screen name="Auth" component={AuthScreen} />
      ) : user && !hasUsername ? (
        <Root.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Root.Screen name="Main" component={MainTabs} />
      )}
    </Root.Navigator>
  );
}
