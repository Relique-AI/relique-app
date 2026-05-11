import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { MarketStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import { ListingCard } from '../components/ListingCard';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'Market'>;
};

type SortOption = 'recent' | 'price_asc' | 'price_desc';

const PAGE_SIZE = 20;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.section * 2 - 12) / 2;

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Récent',
  price_asc: 'Prix ↑',
  price_desc: 'Prix ↓',
};

export function MarketScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortOption>('recent');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadingRef = useRef(false);

  // ─── Chargement des annonces ────────────────────────────────────────────────

  const pageRef = useRef(0);

  const loadListings = async (reset: boolean, search: string, category: string, sortBy: SortOption) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!reset) setLoading(true);

    if (reset) pageRef.current = 0;
    const from = pageRef.current * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('listings')
      .select('*, profiles(username)')
      .eq('status', 'active')
      .range(from, to);

    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
    }
    if (category !== 'Tous') {
      query = query.ilike('category', `%${category}%`);
    }
    if (sortBy === 'recent') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'price_asc') query = query.order('price_final', { ascending: true });
    else query = query.order('price_final', { ascending: false });

    const { data } = await query;
    const items = (data ?? []) as Listing[];

    setListings((prev) => (reset ? items : [...prev, ...items]));
    setHasMore(items.length === PAGE_SIZE);
    pageRef.current = reset ? 1 : pageRef.current + 1;
    setPage(pageRef.current);
    setLoading(false);
    loadingRef.current = false;
  };

  // ─── Favoris ────────────────────────────────────────────────────────────────

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map((f) => f.listing_id)));
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) return;
    const isFav = favorites.has(listingId);
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
    }
  };

  // ─── Initialisation ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadFavorites();
    loadListings(true, '', 'Tous', 'recent');
  }, []);

  // ─── Debounce search ────────────────────────────────────────────────────────

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(text), 400);
  };

  // ─── Reload sur changement de filtres ───────────────────────────────────────

  useEffect(() => {
    loadListings(true, searchQuery, 'Tous', sort);
  }, [searchQuery, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFavorites(),
      loadListings(true, searchQuery, 'Tous', sort),
    ]);
    setRefreshing(false);
  };

  const handleEndReached = () => {
    if (hasMore && !loadingRef.current) {
      loadListings(false, searchQuery, 'Tous', sort);
    }
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  const renderItem = ({ item, index }: { item: Listing; index: number }) => (
    <View style={[styles.cardWrapper, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}>
      <ListingCard
        listing={item}
        width={CARD_WIDTH}
        isFavorited={favorites.has(item.id)}
        onPress={() => navigation.navigate('Listing', { id: item.id })}
        onFavoriteToggle={() => toggleFavorite(item.id)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Barre recherche */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <AppTextInput
            style={styles.searchText}
            value={searchInput}
            onChangeText={handleSearchChange}
            placeholder="Rechercher un objet..."

            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tri */}
      <View style={styles.sortRow}>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
              {SORT_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={5}
        initialNumToRender={6}
        updateCellsBatchingPeriod={100}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune annonce</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Soyez le premier à publier un objet !'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && listings.length > 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : null
        }
      />

      {loading && listings.length === 0 && (
        <View style={styles.fullLoader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.section,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  inboxBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.chipBackground,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  searchText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryStrip: {
    paddingHorizontal: spacing.section,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.background,
    fontFamily: fonts.bodySemiBold,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.section,
    paddingBottom: 12,
    gap: 8,
  },
  sortBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  sortBtnActive: {
    borderColor: colors.primary,
  },
  sortText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  sortTextActive: {
    color: colors.primary,
    fontFamily: fonts.bodySemiBold,
  },
  grid: {
    paddingHorizontal: spacing.section,
    paddingBottom: 24,
    gap: 12,
  },
  cardWrapper: { flex: 1 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: spacing.section,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  fullLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
