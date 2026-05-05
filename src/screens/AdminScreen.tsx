import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Admin'>;
};

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  listing_id: string;
  reporter_id: string;
  listing_name: string;
  listing_image: string | null;
  reporter_username: string | null;
};

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  scam: 'Arnaque / Fraude',
  prohibited: 'Objet interdit',
};

export function AdminScreen({ navigation }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select(`
        id, reason, status, created_at, listing_id, reporter_id,
        listings(name, images),
        profiles(username)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) {
      setReports(data.map((r: any) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
        listing_id: r.listing_id,
        reporter_id: r.reporter_id,
        listing_name: r.listings?.name ?? 'Annonce supprimée',
        listing_image: r.listings?.images?.[0] ?? null,
        reporter_username: r.profiles?.username ?? 'Anonyme',
      })));
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadReports(); }, []));

  const dismissReport = async (id: string) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const removeListing = async (reportId: string, listingId: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'L\'annonce sera retirée du marché. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId);
            await supabase.from('reports').update({ status: 'resolved' }).eq('listing_id', listingId);
            setReports((prev) => prev.filter((r) => r.listing_id !== listingId));
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.listing_image ? (
          <Image source={{ uri: item.listing_image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.listingName} numberOfLines={1}>{item.listing_name}</Text>
          <Text style={styles.meta}>
            Signalé par <Text style={{ color: colors.textPrimary }}>{item.reporter_username}</Text>
          </Text>
          <Text style={styles.meta}>
            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      <View style={styles.reasonBadge}>
        <Ionicons name="flag" size={13} color={colors.danger} />
        <Text style={styles.reasonText}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnDismiss}
          onPress={() => dismissReport(item.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.btnDismissText}>Ignorer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnRemove}
          onPress={() => removeListing(item.id, item.listing_id)}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={15} color="#fff" />
          <Text style={styles.btnRemoveText}>Supprimer l'annonce</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Modération</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyText}>Aucun signalement en attente</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  list: { padding: spacing.section, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 10, resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  listingName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },

  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(224,135,102,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  reasonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },

  actions: { flexDirection: 'row', gap: 10 },
  btnDismiss: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    alignItems: 'center',
  },
  btnDismissText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  btnRemove: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: colors.danger,
  },
  btnRemoveText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 40, color: colors.primary },
  emptyText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary },
});
