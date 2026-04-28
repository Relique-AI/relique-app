import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { AnalysisResult } from '../types';

type Tab = 'listings' | 'favorites';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.section * 2 - 12) / 2;

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
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

  const loadAll = useCallback(async () => {
    await Promise.all([loadMyListings(), loadFavorites()]);
    setLoading(false);
  }, [loadMyListings, loadFavorites]);

  useEffect(() => { loadAll(); }, []);

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

  // ─── Rendu carte "Mes annonces" ──────────────────────────────────────────────

  const renderMyListing = ({ item }: { item: Listing }) => {
    const isSold = item.status === 'sold';
    return (
      <View style={styles.myCard}>
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
          </View>
        </View>
        <View style={styles.myCardActions}>
          {!isSold && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => markAsSold(item.id)}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => deleteListing(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#E57373" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Rendu carte "Favoris" ───────────────────────────────────────────────────

  const renderFavorite = ({ item, index }: { item: Listing; index: number }) => (
    <View style={[styles.favWrapper, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const currentData = tab === 'listings' ? myListings : favorites;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mon profil</Text>
          <Text style={styles.headerEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#E57373" />
        </TouchableOpacity>
      </View>

      {/* Tabs internes */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'listings' && styles.tabItemActive]}
          onPress={() => setTab('listings')}
        >
          <Text style={[styles.tabText, tab === 'listings' && styles.tabTextActive]}>
            Mes annonces ({myListings.length})
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
      </View>

      {/* Contenu */}
      <FlatList
        key={tab}
        data={currentData}
        keyExtractor={(item) => item.id}
        numColumns={tab === 'favorites' ? 2 : 1}
        renderItem={tab === 'listings' ? renderMyListing : renderFavorite}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={tab === 'listings' ? 'cube-outline' : 'heart-outline'}
              size={44}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              {tab === 'listings' ? 'Aucune annonce' : 'Aucun favori'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'listings'
                ? 'Publiez votre premier objet via l\'onglet Scanner.'
                : 'Ajoutez des annonces à vos favoris depuis le marché.'}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.primary },
  headerEmail: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
  statusActive: { backgroundColor: 'rgba(76,175,80,0.15)' },
  statusSold: { backgroundColor: 'rgba(158,158,158,0.15)' },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  statusTextActive: { color: '#4CAF50' },
  statusTextSold: { color: colors.textSecondary },
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

  // Vide
  empty: { alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: spacing.section },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
