import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BrowseStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import { ListingCard } from '../components/ListingCard';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.section * 2 - 12) / 2;

type Props = {
  navigation: StackNavigationProp<BrowseStackParamList, 'BrowseListings'>;
  route: RouteProp<BrowseStackParamList, 'BrowseListings'>;
};

const PAGE_SIZE = 20;

export function BrowseListingsScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const pageRef = useRef(0);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings(true, searchQuery);
    }, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map((f: any) => f.listing_id)));
  };

  const loadListings = async (reset = false, search?: string) => {
    if (reset) { pageRef.current = 0; setHasMore(true); }
    const from = pageRef.current * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const s = search !== undefined ? search : searchQuery;
    let dbQuery = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .ilike('category', `%${category}%`);
    if (s.trim()) {
      dbQuery = dbQuery.ilike('name', `%${s.trim()}%`);
    }
    const { data } = await dbQuery
      .order('created_at', { ascending: false })
      .range(from, to);
    const rows = (data ?? []) as Listing[];
    if (rows.length < PAGE_SIZE) setHasMore(false);
    setListings((prev) => reset ? rows : [...prev, ...rows]);
    pageRef.current += 1;
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings(true, searchQuery);
    setRefreshing(false);
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{category}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <AppTextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher dans cette catégorie..."

          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            width={CARD_WIDTH}
            isFavorited={favorites.has(item.id)}
            onPress={() => navigation.navigate('Listing', { id: item.id })}
            onFavoriteToggle={() => toggleFavorite(item.id)}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        onEndReached={() => hasMore && loadListings(false, searchQuery)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune annonce</Text>
            <Text style={styles.emptyText}>Il n'y a pas encore d'annonces dans cette catégorie.</Text>
          </View>
        }
        ListFooterComponent={hasMore && listings.length > 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.section,
    marginVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  grid: { paddingHorizontal: spacing.section, paddingTop: 12, paddingBottom: 24, gap: 12 },
  row: { gap: 12, justifyContent: 'space-between' },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: spacing.section },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
