import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing, Profile, SavedEstimation } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { AnalysisResult, ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Profile'>;
  route: RouteProp<ProfileStackParamList, 'Profile'>;
};

type Tab = 'listings' | 'favorites' | 'purchases';

type Purchase = {
  id: string;
  amount: number;
  fee: number;
  status: string;
  shipping_method: string | null;
  delivery_address: string | null;
  shipping_status: string | null;
  tracking_number: string | null;
  created_at: string;
  listing_id: string;
  listings: { name: string; images: string[] } | null;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.section * 2 - 12) / 2;

export function ProfileScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'listings');

  // Sync tab when navigating here with initialTab param (screen already mounted)
  useEffect(() => {
    if (route.params?.initialTab) setTab(route.params.initialTab);
  }, [route.params?.initialTab]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [pendingShipments, setPendingShipments] = useState<Record<string, { transaction_id: string; delivery_address: string | null; label_url: string | null }>>({});
  const [deliveredListingIds, setDeliveredListingIds] = useState<Set<string>>(new Set());
  const [disputeStatuses, setDisputeStatuses] = useState<Record<string, string>>({}); // transaction_id → status
  const [trackingModal, setTrackingModal] = useState<{ transactionId: string; deliveryAddress: string | null } | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [savedEstimations, setSavedEstimations] = useState<SavedEstimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyListings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });
    if (data) setMyListings(data as Listing[]);
  }, [user]);

  const loadQuestionCounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('listing_questions')
      .select('listing_id, listings!inner(seller_id)')
      .eq('listings.seller_id', user.id)
      .is('answer', null);
    if (!data) return;
    const counts: Record<string, number> = {};
    for (const row of data as any[]) {
      counts[row.listing_id] = (counts[row.listing_id] ?? 0) + 1;
    }
    setQuestionCounts(counts);
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      const listings = data.map((f: any) => f.listings).filter(Boolean) as Listing[];
      setFavorites(listings);
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data as Profile);
    }
  }, [user]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    const [txRes, disputeRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, amount, fee, status, shipping_method, delivery_address, shipping_status, tracking_number, created_at, listing_id, listings(name, images)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('disputes')
        .select('transaction_id, status')
        .eq('buyer_id', user.id),
    ]);
    if (txRes.data) setPurchases(txRes.data as unknown as Purchase[]);
    if (disputeRes.data) {
      const map: Record<string, string> = {};
      for (const d of disputeRes.data as any[]) map[d.transaction_id] = d.status;
      setDisputeStatuses(map);
    }
  }, [user]);

  const loadSavedEstimations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_estimations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedEstimations(data as SavedEstimation[]);
  }, [user]);

  const loadPendingShipments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('id, listing_id, delivery_address, label_url, shipping_status')
      .eq('seller_id', user.id)
      .in('shipping_status', ['to_ship', 'to_hand', 'delivered']);
    if (data) {
      const pending: Record<string, { transaction_id: string; delivery_address: string | null; label_url: string | null }> = {};
      const delivered = new Set<string>();
      for (const t of data as any[]) {
        if (t.shipping_status === 'to_ship') {
          pending[t.listing_id] = { transaction_id: t.id, delivery_address: t.delivery_address, label_url: t.label_url ?? null };
        } else if (t.shipping_status === 'delivered') {
          delivered.add(t.listing_id);
        }
      }
      setPendingShipments(pending);
      setDeliveredListingIds(delivered);
    }
  }, [user]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadProfile(), loadMyListings(), loadFavorites(), loadPurchases(), loadQuestionCounts(), loadPendingShipments(), loadSavedEstimations()]);
    setLoading(false);
  }, [loadProfile, loadMyListings, loadFavorites, loadPurchases, loadQuestionCounts, loadPendingShipments, loadSavedEstimations]);

  useEffect(() => { loadAll(); }, []);

  // Reload data when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      loadMyListings();
      loadPurchases();
      loadQuestionCounts();
      loadPendingShipments();
      loadSavedEstimations();
      // Second pass after 4s to catch webhook-created transactions (Stripe webhook latency)
      const t = setTimeout(() => { loadPurchases(); loadMyListings(); }, 4000);
      return () => clearTimeout(t);
    });
    return unsubscribe;
  }, [navigation, loadProfile, loadMyListings, loadPurchases, loadQuestionCounts, loadPendingShipments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const sellDraft = (draft: SavedEstimation) => {
    navigation.getParent()?.navigate('Scanner', {
      screen: 'Sell',
      params: {
        analysis: draft.analysis,
        photos: [],
        preUploadedPhotoUrls: draft.photo_urls,
      },
    });
  };

  const deleteDraft = (id: string) => {
    Alert.alert('Supprimer ce brouillon ?', 'Cette estimation sera définitivement supprimée.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('saved_estimations').delete().eq('id', id);
          setSavedEstimations(prev => prev.filter(d => d.id !== id));
        },
      },
    ]);
  };

  const deleteListing = (id: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette action est irréversible. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('listings').update({ status: 'deleted' }).eq('id', id);
            setMyListings((prev) => prev.filter((l) => l.id !== id));
          },
        },
      ],
    );
  };

  const markAsSold = (id: string) => {
    Alert.alert(
      'Marquer comme vendu',
      'L\'annonce sera retirée du marché.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await supabase.from('listings').update({ status: 'sold' }).eq('id', id);
            setMyListings((prev) =>
              prev.map((l) => (l.id === id ? { ...l, status: 'sold' } : l)),
            );
          },
        },
      ],
    );
  };

  const confirmReceipt = (transactionId: string) => {
    Alert.alert(
      'Confirmer la réception',
      'Confirmez-vous avoir reçu votre commande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const session = (await supabase.auth.getSession()).data.session;
            await supabase.functions.invoke('confirm-reception', {
              body: { transaction_id: transactionId },
              headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            loadPurchases();
          },
        },
      ],
    );
  };

  const markShipped = async () => {
    if (!trackingModal) return;
    const session = (await supabase.auth.getSession()).data.session;
    const { data, error } = await supabase.functions.invoke('mark-shipped', {
      body: { transaction_id: trackingModal.transactionId, tracking_number: trackingInput.trim() || null },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error || data?.error) {
      Alert.alert('Erreur', data?.error ?? 'Impossible de marquer comme expédié.');
      return;
    }
    setTrackingModal(null);
    setTrackingInput('');
    loadPendingShipments();
    loadMyListings();
  };

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  // ─── Rendu carte "Mes annonces" ──────────────────────────────────────────────

  const SHIPPING_METHOD_LABELS: Record<string, string> = {
    hand: 'Remise en main propre',
    relay: 'Mondial Relay',
    colissimo: 'Colissimo',
    chronopost: 'Chronopost',
  };

  const SHIPPING_STATUS_COLORS: Record<string, string> = {
    to_ship: colors.primary,
    shipped: '#2196F3',
    delivered: colors.success,
  };

  const renderMyListing = ({ item }: { item: Listing }) => {
    const isSold = item.status === 'sold';
    const unanswered = questionCounts[item.id] ?? 0;
    const pendingShipment = pendingShipments[item.id];
    const isDelivered = deliveredListingIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.myCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Listing', { id: item.id })}
      >
        <View style={styles.myCardLeft}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.myCardImg} />
          ) : (
            <View style={[styles.myCardImg, styles.myCardImgPlaceholder]}>
              <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.myCardBody}>
          <Text style={styles.myCardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.myCardPrice}>{item.price_final} €</Text>
          <View style={styles.myCardRow}>
            <View style={[styles.statusBadge, isSold ? styles.statusSold : styles.statusActive]}>
              <Text style={[styles.statusText, isSold ? styles.statusTextSold : styles.statusTextActive]}>
                {isSold ? 'Vendu' : 'En ligne'}
              </Text>
            </View>
            {unanswered > 0 && (
              <View style={styles.questionBadge}>
                <Ionicons name="help-circle" size={12} color={colors.primary} />
                <Text style={styles.questionBadgeText}>{unanswered} question{unanswered > 1 ? 's' : ''}</Text>
              </View>
            )}
            {isDelivered && (
              <View style={styles.deliveredBadge}>
                <Ionicons name="checkmark-circle-outline" size={11} color={colors.background} />
                <Text style={styles.deliveredBadgeText}>Réception confirmée</Text>
              </View>
            )}
            {!isDelivered && pendingShipment && (
              <TouchableOpacity
                style={styles.shipBadge}
                onPress={() => { setTrackingModal({ transactionId: pendingShipment.transaction_id, deliveryAddress: pendingShipment.delivery_address }); setTrackingInput(''); }}
              >
                <Ionicons name="send-outline" size={11} color={colors.background} />
                <Text style={styles.shipBadgeText}>Expédier</Text>
              </TouchableOpacity>
            )}
            {pendingShipment?.label_url && (
              <TouchableOpacity
                style={styles.labelBadge}
                onPress={() => Linking.openURL(pendingShipment.label_url!)}
              >
                <Ionicons name="download-outline" size={11} color={colors.primary} />
                <Text style={styles.labelBadgeText}>Étiquette</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.myCardActions}>
          {!isSold && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditListing', { id: item.id })}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {!isSold && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => markAsSold(item.id)}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => deleteListing(item.id)}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Rendu carte "Favoris" ───────────────────────────────────────────────────

  const renderFavorite = ({ item, index }: { item: Listing; index: number }) => (
    <TouchableOpacity
      style={[styles.favWrapper, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('Listing', { id: item.id })}
    >
      <View style={[styles.favCard, { width: CARD_WIDTH }]}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={[styles.favImg, { height: CARD_WIDTH }]} />
        ) : (
          <View style={[styles.favImg, { height: CARD_WIDTH }, styles.favImgPlaceholder]}>
            <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.favInfo}>
          <Text style={styles.favName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.favPrice}>{item.price_final} €</Text>
          <ConditionBadge condition={item.condition as AnalysisResult['condition']} size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPurchase = ({ item }: { item: Purchase }) => {
    const net = (item.amount / 100).toFixed(2);
    const date = new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const isPending = item.status === 'pending';
    const isPostal = item.shipping_method && item.shipping_method !== 'hand';
    const shippingStatus = item.shipping_status;
    const existingDispute = disputeStatuses[item.id];
    const daysSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const canDispute = !isPending && !existingDispute && shippingStatus !== 'refunded' && daysSince <= 7 &&
      ['delivered', 'shipped', 'to_hand', 'to_ship', 'completed'].includes(shippingStatus ?? '');
    return (
      <TouchableOpacity
        style={styles.myCard}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Listing', { id: item.listing_id })}
      >
        <View style={styles.myCardLeft}>
          {item.listings?.images?.[0] ? (
            <Image source={{ uri: item.listings.images[0] }} style={styles.myCardImg} />
          ) : (
            <View style={[styles.myCardImg, styles.myCardImgPlaceholder]}>
              <Ionicons name="bag-outline" size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={[styles.myCardBody, { flex: 1 }]}>
          <Text style={styles.myCardName} numberOfLines={2}>{item.listings?.name ?? 'Annonce supprimée'}</Text>
          <Text style={styles.myCardPrice}>{net} €</Text>
          <View style={styles.myCardRow}>
            <View style={[styles.statusBadge, isPending ? styles.statusPending : styles.statusActive]}>
              <Text style={[styles.statusText, isPending ? styles.statusTextPending : styles.statusTextActive]}>
                {isPending ? 'En cours' : 'Payé'}
              </Text>
            </View>
            {shippingStatus === 'to_hand' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,152,0,0.15)' }]}>
                <Text style={[styles.statusText, { color: '#FF9800' }]}>Remise à convenir</Text>
              </View>
            )}
            {isPostal && shippingStatus === 'to_ship' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,152,0,0.15)' }]}>
                <Text style={[styles.statusText, { color: '#FF9800' }]}>En attente d'expédition</Text>
              </View>
            )}
            {isPostal && shippingStatus === 'shipped' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(33,150,243,0.12)' }]}>
                <Text style={[styles.statusText, { color: '#2196F3' }]}>En livraison</Text>
              </View>
            )}
            {shippingStatus === 'delivered' && (
              <View style={[styles.statusBadge, styles.statusActive]}>
                <Text style={[styles.statusText, styles.statusTextActive]}>Livré</Text>
              </View>
            )}
            {shippingStatus === 'refunded' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(33,150,100,0.15)' }]}>
                <Text style={[styles.statusText, { color: '#1a6b3a' }]}>Remboursé</Text>
              </View>
            )}
          </View>
          {item.tracking_number && shippingStatus !== 'delivered' && shippingStatus !== 'refunded' && (
            <Text style={styles.trackingText}>Suivi : {item.tracking_number}</Text>
          )}
          {shippingStatus !== 'refunded' && (shippingStatus === 'to_hand' || (isPostal && shippingStatus === 'shipped')) && (
            <TouchableOpacity
              style={styles.confirmReceiptBtn}
              onPress={() => confirmReceipt(item.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={13} color={colors.background} />
              <Text style={styles.confirmReceiptText}>
                {shippingStatus === 'to_hand' ? 'Confirmer la remise' : 'Confirmer réception'}
              </Text>
            </TouchableOpacity>
          )}
          {canDispute && (
            <TouchableOpacity
              style={styles.disputeBtn}
              onPress={() => navigation.navigate('DisputeScreen', {
                transaction_id: item.id,
                listing_name: item.listings?.name ?? 'Commande',
                amount: item.amount,
              })}
            >
              <Ionicons name="warning-outline" size={13} color={colors.danger} />
              <Text style={styles.disputeBtnText}>Signaler un problème</Text>
            </TouchableOpacity>
          )}
          {existingDispute && (
            <View style={styles.disputeStatusBadge}>
              <Ionicons name="shield-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.disputeStatusText}>
                Litige {existingDispute === 'open' ? 'ouvert' : existingDispute === 'under_review' ? 'en cours d\'examen' : existingDispute === 'resolved_buyer' ? 'résolu ✓' : existingDispute === 'resolved_seller' ? 'clôturé' : existingDispute}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.purchaseDate}>{date}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const sortedListings = [...myListings].sort((a, b) => {
    const aScore = (pendingShipments[a.id] ? 2 : 0) + ((questionCounts[a.id] ?? 0) > 0 ? 1 : 0);
    const bScore = (pendingShipments[b.id] ? 2 : 0) + ((questionCounts[b.id] ?? 0) > 0 ? 1 : 0);
    return bScore - aScore;
  });
  const currentData = tab === 'listings' ? sortedListings : tab === 'favorites' ? favorites : purchases;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="pencil" size={10} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {profile?.username ?? user?.email?.split('@')[0] ?? 'Mon profil'}
          </Text>
          <Text style={styles.headerEmail}>{user?.email}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Wallet')}>
            <Ionicons name="wallet-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Alerts')}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs internes */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'listings' && styles.tabItemActive]}
          onPress={() => setTab('listings')}
        >
          <Text style={[styles.tabText, tab === 'listings' && styles.tabTextActive]}>
            Annonces ({myListings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'favorites' && styles.tabItemActive]}
          onPress={() => setTab('favorites')}
        >
          <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>
            Favoris ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'purchases' && styles.tabItemActive]}
          onPress={() => setTab('purchases')}
        >
          <Text style={[styles.tabText, tab === 'purchases' && styles.tabTextActive]}>
            Achats ({purchases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      <FlatList
        key={tab}
        data={currentData}
        keyExtractor={(item) => item.id}
        numColumns={tab === 'favorites' ? 2 : 1}
        renderItem={tab === 'listings' ? renderMyListing : tab === 'favorites' ? renderFavorite : renderPurchase as any}
        contentContainerStyle={tab === 'favorites' ? styles.favGrid : styles.myList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          tab === 'listings' && savedEstimations.length > 0 ? (
            <View style={styles.draftSection}>
              <Text style={styles.draftSectionLabel}>Brouillons</Text>
              {savedEstimations.map((draft) => {
                const date = new Date(draft.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                return (
                  <TouchableOpacity
                    key={draft.id}
                    style={[styles.myCard, { marginBottom: 10 }]}
                    activeOpacity={0.75}
                    onPress={() => sellDraft(draft)}
                  >
                    <View style={styles.myCardLeft}>
                      {draft.photo_urls[0] ? (
                        <Image source={{ uri: draft.photo_urls[0] }} style={styles.myCardImg} />
                      ) : (
                        <View style={[styles.myCardImg, styles.myCardImgPlaceholder]}>
                          <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.myCardBody}>
                      <Text style={styles.myCardName} numberOfLines={2}>{draft.analysis?.name ?? '—'}</Text>
                      <Text style={styles.myCardPrice}>{draft.analysis?.priceMin ?? '?'} — {draft.analysis?.priceMax ?? '?'} €</Text>
                      <View style={styles.myCardRow}>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(245,184,46,0.12)' }]}>
                          <Text style={[styles.statusText, { color: colors.primary }]}>Brouillon · {date}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.myCardActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => sellDraft(draft)}>
                        <Ionicons name="bag-add-outline" size={22} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => deleteDraft(draft.id)}>
                        <Ionicons name="trash-outline" size={22} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {myListings.length > 0 && <Text style={[styles.draftSectionLabel, { marginTop: 16 }]}>Mes annonces</Text>}
            </View>
          ) : null
        }
        ItemSeparatorComponent={tab === 'listings' ? () => <View style={styles.separator} /> : undefined}
        ListFooterComponent={
          <View style={styles.footer} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={tab === 'listings' ? 'cube-outline' : tab === 'favorites' ? 'heart-outline' : 'bag-outline'}
              size={44}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              {tab === 'listings' ? 'Aucune annonce' : tab === 'favorites' ? 'Aucun favori' : 'Aucun achat'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'listings'
                ? 'Publiez votre premier objet via l\'onglet Scanner.'
                : tab === 'favorites'
                ? 'Ajoutez des annonces à vos favoris depuis le marché.'
                : 'Vos achats effectués dans l\'app apparaîtront ici.'}
            </Text>
          </View>
        }
      />

      {/* Tracking number modal */}
      <Modal visible={!!trackingModal} transparent animationType="slide" onRequestClose={() => setTrackingModal(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setTrackingModal(null)} />
          <View style={styles.trackingSheet}>
            <Text style={styles.trackingSheetTitle}>Marquer comme expédié</Text>
            {trackingModal?.deliveryAddress && (
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.addressBoxText}>{trackingModal.deliveryAddress}</Text>
              </View>
            )}
            <Text style={styles.trackingLabel}>Numéro de suivi (optionnel)</Text>
            <AppTextInput
              style={styles.trackingInput}
              value={trackingInput}
              onChangeText={setTrackingInput}
              placeholder="Ex : 6A12345678901"

              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.trackingConfirmBtn} onPress={markShipped}>
              <Ionicons name="send-outline" size={16} color={colors.background} />
              <Text style={styles.trackingConfirmText}>Confirmer l'expédition</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: 56, height: 56, borderRadius: 28, resizeMode: 'cover' },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },
  headerEmail: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229,115,115,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    margin: spacing.section,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabItemActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.background },

  // Brouillons
  draftSection: { paddingHorizontal: spacing.section, paddingTop: spacing.base },
  draftSectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },

  // Mes annonces
  myList: { paddingHorizontal: spacing.section, paddingBottom: 24 },
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 12,
    paddingRight: 12,
  },
  myCardLeft: { flexShrink: 0 },
  myCardImg: { width: 80, height: 80, resizeMode: 'cover' },
  myCardImgPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  myCardBody: { flex: 1, paddingVertical: 10 },
  myCardName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, lineHeight: 19 },
  myCardPrice: { fontFamily: fonts.serif, fontSize: 18, color: colors.primary, marginTop: 2 },
  myCardRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  statusActive: { backgroundColor: 'rgba(181,212,121,0.15)' },
  statusSold: { backgroundColor: 'rgba(169,150,128,0.12)' },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  statusTextActive: { color: colors.success },
  statusTextSold: { color: colors.textSecondary },
  statusPending: { backgroundColor: 'rgba(245,184,46,0.15)' },
  statusTextPending: { color: colors.primary },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245,184,46,0.15)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  questionBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.primary },
  purchaseDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, paddingRight: 4 },
  myCardActions: { flexDirection: 'column', gap: 4 },
  actionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  separator: { height: 10 },

  // Favoris
  favGrid: { paddingHorizontal: spacing.section, paddingBottom: 24, gap: 12 },
  favWrapper: { flex: 1 },
  favCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  favImg: { width: '100%', resizeMode: 'cover' },
  favImgPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  favInfo: { padding: 10, gap: 4 },
  favName: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  favPrice: { fontFamily: fonts.serif, fontSize: 17, color: colors.primary },

  // Footer
  footer: {
    paddingHorizontal: spacing.section,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 4,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  footerBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },

  // Vide
  empty: { alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: spacing.section },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  // Shipping / livraison
  shipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  shipBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.background },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  deliveredBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.background },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,184,46,0.12)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  labelBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.primary },
  trackingText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  confirmReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  confirmReceiptText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.background },
  disputeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: `${colors.danger}50`,
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10,
    marginTop: 6, alignSelf: 'flex-start',
  },
  disputeBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.danger },
  disputeStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
  },
  disputeStatusText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },

  // Tracking modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  trackingSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 48,
    gap: 14,
  },
  trackingSheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  addressBoxText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  trackingLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  trackingInput: {
    backgroundColor: colors.surface,
    borderRadius: 12, padding: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.chipBackground,
  },
  trackingConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  trackingConfirmText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
});
