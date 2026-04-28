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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { MarketStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'Inbox'>;
};

interface Conversation {
  listing_id: string;
  listing_name: string;
  listing_image: string | null;
  other_user_id: string;
  other_username: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function InboxScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    // Récupère tous les messages où l'utilisateur est impliqué
    const { data } = await supabase
      .from('messages')
      .select(`
        listing_id, sender_id, receiver_id, content, read, created_at,
        listings(id, name, images, seller_id),
        sender_profile:profiles!messages_sender_id_fkey(id, username),
        receiver_profile:profiles!messages_receiver_id_fkey(id, username)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Grouper par listing_id, garder le message le plus récent
    const map = new Map<string, Conversation>();
    for (const msg of data as any[]) {
      if (map.has(msg.listing_id)) continue;
      const isSender = msg.sender_id === user.id;
      const otherProfile = isSender ? msg.receiver_profile : msg.sender_profile;
      const listing = msg.listings;

      const unreadRes = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', msg.listing_id)
        .eq('receiver_id', user.id)
        .eq('read', false);

      map.set(msg.listing_id, {
        listing_id: msg.listing_id,
        listing_name: listing?.name ?? 'Annonce',
        listing_image: listing?.images?.[0] ?? null,
        other_user_id: isSender ? msg.receiver_id : msg.sender_id,
        other_username: otherProfile?.username ?? 'Utilisateur',
        last_message: msg.content,
        last_message_at: msg.created_at,
        unread_count: unreadRes.count ?? 0,
      });
    }

    setConversations(Array.from(map.values()));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        navigation.navigate('Chat', {
          listing_id: item.listing_id,
          receiver_id: item.other_user_id,
          listing_name: item.listing_name,
        })
      }
      activeOpacity={0.75}
    >
      {/* Photo annonce */}
      <View style={styles.thumb}>
        {item.listing_image ? (
          <Image source={{ uri: item.listing_image }} style={styles.thumbImg} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        )}
      </View>

      {/* Contenu */}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.listingName} numberOfLines={1}>{item.listing_name}</Text>
          <Text style={styles.time}>
            {new Date(item.last_message_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <Text style={styles.username}>{item.other_username}</Text>
        <View style={styles.rowBottom}>
          <Text style={[styles.preview, item.unread_count > 0 && styles.previewUnread]} numberOfLines={1}>
            {item.last_message}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.listing_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyText}>Contactez un vendeur depuis le détail d'une annonce.</Text>
            </View>
          }
        />
      )}
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
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.primary },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 14,
    gap: 14,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  listingName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, flex: 1 },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginLeft: 8 },
  username: { fontFamily: fonts.body, fontSize: 12, color: colors.primary, marginBottom: 4 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, flex: 1 },
  previewUnread: { fontFamily: fonts.bodySemiBold, color: colors.textPrimary },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.background },
  separator: { height: 1, backgroundColor: colors.surface, marginLeft: spacing.section + 56 + 14 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 80, paddingHorizontal: spacing.section },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
});
