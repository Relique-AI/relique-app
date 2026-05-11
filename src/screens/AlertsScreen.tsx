import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Alerts'>;
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

type Prefs = {
  new_message: boolean;
  offer_received: boolean;
  question_asked: boolean;
  listing_sold: boolean;
};

const DEFAULT_PREFS: Prefs = {
  new_message: true,
  offer_received: true,
  question_asked: true,
  listing_sold: true,
};

const ACTIVITY_ROWS: Array<{ key: keyof Prefs; label: string; icon: string }> = [
  { key: 'new_message', label: 'Nouveau message', icon: 'chatbubble-outline' },
  { key: 'offer_received', label: 'Offre reçue', icon: 'pricetag-outline' },
  { key: 'question_asked', label: 'Question sur votre annonce', icon: 'help-circle-outline' },
  { key: 'listing_sold', label: 'Annonce vendue', icon: 'checkmark-circle-outline' },
];

export function AlertsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categoryAlerts, setCategoryAlerts] = useState<Set<string>>(new Set());
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [kwResult, catResult, prefsResult] = await Promise.all([
      supabase.from('keyword_alerts').select('keyword').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('favorite_categories').select('category').eq('user_id', user.id),
      supabase.from('notification_prefs').select('new_message, offer_received, question_asked, listing_sold').eq('user_id', user.id).maybeSingle(),
    ]);
    setKeywords((kwResult.data ?? []).map((r: any) => r.keyword));
    setCategoryAlerts(new Set((catResult.data ?? []).map((r: any) => r.category)));
    if (prefsResult.data) setPrefs(prefsResult.data as Prefs);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addKeyword = async () => {
    const kw = newKeyword.trim();
    if (!kw || keywords.some((k) => k.toLowerCase() === kw.toLowerCase()) || keywords.length >= 10) return;
    setKeywords((prev) => [...prev, kw]);
    setNewKeyword('');
    await supabase.from('keyword_alerts').insert({ user_id: user!.id, keyword: kw });
  };

  const removeKeyword = async (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
    await supabase.from('keyword_alerts').delete().eq('user_id', user!.id).eq('keyword', kw);
  };

  const toggleCategory = async (cat: string) => {
    const isOn = categoryAlerts.has(cat);
    const next = new Set(categoryAlerts);
    if (isOn) {
      next.delete(cat);
      setCategoryAlerts(next);
      await supabase.from('favorite_categories').delete().eq('user_id', user!.id).eq('category', cat);
    } else {
      next.add(cat);
      setCategoryAlerts(next);
      await supabase.from('favorite_categories').insert({ user_id: user!.id, category: cat });
    }
  };

  const togglePref = async (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await supabase.from('notification_prefs').upsert({ user_id: user!.id, ...next });
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
        <Text style={styles.title}>Mes alertes</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Mots-clés ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Mots-clés</Text>
        <Text style={styles.sectionSub}>Soyez alerté dès qu'une annonce correspond.</Text>
        <View style={styles.card}>
          <View style={styles.chipsWrap}>
            {keywords.length === 0 && (
              <Text style={styles.emptyChips}>Aucun mot-clé pour l'instant.</Text>
            )}
            {keywords.map((kw) => (
              <TouchableOpacity
                key={kw}
                style={styles.chip}
                onPress={() => removeKeyword(kw)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{kw}</Text>
                <Ionicons name="close" size={13} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {keywords.length < 10 ? (
            <View style={styles.kwInputRow}>
              <AppTextInput
                style={styles.kwInput}
                value={newKeyword}
                onChangeText={setNewKeyword}
                placeholder="Ajouter un mot-clé..."

                returnKeyType="done"
                onSubmitEditing={addKeyword}
                maxLength={40}
              />
              <TouchableOpacity
                style={[styles.kwAddBtn, !newKeyword.trim() && { opacity: 0.4 }]}
                onPress={addKeyword}
                disabled={!newKeyword.trim()}
              >
                <Ionicons name="add" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.limitText}>Limite de 10 mots-clés atteinte.</Text>
          )}
        </View>

        {/* ── Catégories ───────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Catégories</Text>
        <Text style={styles.sectionSub}>Activez les catégories qui vous intéressent.</Text>
        <View style={styles.card}>
          {CATEGORIES.map((cat, i) => (
            <View key={cat.name}>
              <View style={styles.itemRow}>
                <View style={styles.itemIcon}>
                  <Ionicons name={cat.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.itemLabel}>{cat.name}</Text>
                <Switch
                  value={categoryAlerts.has(cat.name)}
                  onValueChange={() => toggleCategory(cat.name)}
                  trackColor={{ false: colors.chipBackground, true: 'rgba(245,184,46,0.35)' }}
                  thumbColor={categoryAlerts.has(cat.name) ? colors.primary : colors.textSecondary}
                />
              </View>
              {i < CATEGORIES.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── Activités ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Activités</Text>
        <Text style={styles.sectionSub}>Choisissez les événements qui vous notifient.</Text>
        <View style={styles.card}>
          {ACTIVITY_ROWS.map((item, i) => (
            <View key={item.key}>
              <View style={styles.itemRow}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => togglePref(item.key)}
                  trackColor={{ false: colors.chipBackground, true: 'rgba(245,184,46,0.35)' }}
                  thumbColor={prefs[item.key] ? colors.primary : colors.textSecondary}
                />
              </View>
              {i < ACTIVITY_ROWS.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

      </ScrollView>
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
  title: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },
  scroll: { padding: spacing.section, paddingBottom: 48 },

  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
    paddingBottom: 10,
    minHeight: 52,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,184,46,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.3)',
  },
  chipText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  emptyChips: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, paddingVertical: 4 },
  kwInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  kwInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 8,
  },
  kwAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    padding: 14,
    paddingTop: 0,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245,184,46,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  rowDivider: { height: 1, backgroundColor: colors.background, marginHorizontal: 16 },
});
