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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing, Profile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { AnalysisResult, ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Profile'>;
};

type Tab = 'listings' | 'favorites' | 'purchases';

type Purchase = {
  id: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
  listing_id: string;
  listings: { name: string; images: string[] } | null;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.section * 2 - 12) / 2;

export function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
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
      setReferralCode(data.referral_code ?? '');
    }
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);
    setReferralCount(count ?? 0);
  }, [user]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, fee, status, created_at, listing_id, listings(name, images)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPurchases(data as unknown as Purchase[]);
  }, [user]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadProfile(), loadMyListings(), loadFavorites(), loadPurchases(), loadQuestionCounts()]);
    setLoading(false);
  }, [loadProfile, loadMyListings, loadFavorites, loadPurchases, loadQuestionCounts]);

  useEffect(() => { loadAll(); }, []);

  // Reload profile + question counts when returning from a sub-screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
      loadQuestionCounts();
    });
    return unsubscribe;
  }, [navigation, loadProfile, loadQuestionCounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
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

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;
    await Share.share({
      message:
        `Rejoins-moi sur Pépite, l'app pour scanner, estimer et vendre tes objets !\n\n` +
        `Utilise mon code de parrainage : ${referralCode}\n\n` +
        `📱 iOS : https://apps.apple.com/app/id6744942840\n` +
        `🤖 Android : https://play.google.com/store/apps/details?id=com.hugosld.pepite`,
    });
  };

  // ─── Rendu carte "Mes annonces" ──────────────────────────────────────────────

  const renderMyListing = ({ item }: { item: Listing }) => {
    const isSold = item.status === 'sold';
    const unanswered = questionCounts[item.id] ?? 0;
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
        <View style={styles.myCardBody}>
          <Text style={styles.myCardName} numberOfLines={2}>{item.listings?.name ?? 'Annonce supprimée'}</Text>
          <Text style={styles.myCardPrice}>{net} €</Text>
          <View style={styles.myCardRow}>
            <View style={[styles.statusBadge, isPending ? styles.statusPending : styles.statusActive]}>
              <Text style={[styles.statusText, isPending ? styles.statusTextPending : styles.statusTextActive]}>
                {isPending ? 'En cours' : 'Payé'}
              </Text>
            </View>
          </View>
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

  const currentData = tab === 'listings' ? myListings : tab === 'favorites' ? favorites : purchases;

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
        ItemSeparatorComponent={tab === 'listings' ? () => <View style={styles.separator} /> : undefined}
        ListFooterComponent={
          <View style={styles.footer}>
            {!!referralCode && (
              <View style={styles.referralCard}>
                <Text style={styles.referralSectionLabel}>Parrainage</Text>
                <View style={styles.referralCodeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralLabel}>Mon code</Text>
                    <Text style={styles.referralCode}>{referralCode}</Text>
                  </View>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral} activeOpacity={0.8}>
                    <Ionicons name="share-social-outline" size={16} color={colors.background} />
                    <Text style={styles.shareBtnText}>Partager</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.referralStatRow}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                  <Text style={styles.referralStatText}>
                    {referralCount === 0
                      ? 'Aucun filleul pour l\'instant'
                      : `${referralCount} filleul${referralCount > 1 ? 's' : ''} parrainé${referralCount > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  myCardRow: { flexDirection: 'row', marginTop: 6 },
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
    marginLeft: 6,
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

  // Parrainage
  referralCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.2)',
    gap: 12,
  },
  referralSectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  referralLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.textDisabled, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1.5 },
  referralCode: { fontFamily: fonts.serif, fontSize: 24, color: colors.primary, letterSpacing: 3 },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.background },
  referralStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referralStatText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },

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
});
