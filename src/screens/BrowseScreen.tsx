import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { BrowseStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';

type Props = {
  navigation: StackNavigationProp<BrowseStackParamList, 'Browse'>;
};

const CATEGORIES = [
  { name: 'Mobilier', icon: 'bed-outline' },
  { name: 'Arts décoratifs', icon: 'color-palette-outline' },
  { name: 'Bijoux', icon: 'diamond-outline' },
  { name: 'Argenterie', icon: 'restaurant-outline' },
  { name: 'Céramique & Porcelaine', icon: 'cafe-outline' },
  { name: 'Horlogerie', icon: 'time-outline' },
  { name: 'Tableaux & Gravures', icon: 'image-outline' },
  { name: 'Livres & BD', icon: 'book-outline' },
  { name: 'Jouets & Jeux', icon: 'game-controller-outline' },
  { name: 'Vintage & Mode', icon: 'shirt-outline' },
  { name: 'Appareils photo', icon: 'camera-outline' },
  { name: 'Vinyles & Musique', icon: 'musical-notes-outline' },
] as const;

export function BrowseScreen({ navigation }: Props) {
  const [visibleCategories, setVisibleCategories] = useState<typeof CATEGORIES[number][]>([...CATEGORIES]);

  const loadAvailableCategories = async () => {
    const { data } = await supabase
      .from('listings')
      .select('category')
      .eq('status', 'active');
    if (!data || data.length === 0) return;
    const dbCats = data.map((r) => (r.category ?? '').toLowerCase());
    const filtered = CATEGORIES.filter((cat) => {
      const lower = cat.name.toLowerCase();
      return dbCats.some((db) => db.includes(lower) || lower.includes(db));
    });
    if (filtered.length > 0) setVisibleCategories(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      loadAvailableCategories();
    }, []),
  );

  const renderCategory = ({ item }: { item: typeof CATEGORIES[number] }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('BrowseListings', { category: item.name })}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={item.icon as any} size={28} color={colors.primary} />
        </View>
        <Text style={styles.cardText}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Parcourir</Text>
        <Text style={styles.subtitle}>Explorez par catégorie</Text>
      </View>

      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => item.name}
        renderItem={renderCategory}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.primary },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: spacing.section, paddingTop: 8, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  separator: { height: 1, backgroundColor: colors.surface },
});
