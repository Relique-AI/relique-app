import { useState, useEffect } from 'react';
import { imgUrl } from '../utils/images';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<{ SellerProfile: { seller_id: string } }, 'SellerProfile'>;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer?: { username: string | null } | null;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.section * 2 - 12) / 2;

export function SellerProfileScreen({ navigation, route }: Props) {
  const { seller_id } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null; created_at: string } | null>(null);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [soldCount, setSoldCount] = useState(0);
  const [responseRate, setResponseRate] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, [seller_id]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadProfile(),
      loadReviews(),
      loadListings(),
      loadSoldCount(),
      loadResponseRate(),
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, created_at')
      .eq('id', seller_id)
      .single();
    if (data) setProfile(data);
  };

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_id')
      .eq('seller_id', seller_id)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      setRating({ avg: Math.round(avg * 10) / 10, count: data.length });
      setReviews(data as any);
    }
  };

  const loadListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', seller_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (data) setListings(data as Listing[]);
  };

  const loadSoldCount = async () => {
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', seller_id)
      .eq('status', 'sold');
    setSoldCount(count ?? 0);
  };

  const loadResponseRate = async () => {
    const { data: received } = await supabase
      .from('messages')
      .select('listing_id, sender_id')
      .eq('receiver_id', seller_id)
      .neq('sender_id', seller_id);
    if (!received || received.length === 0) return;

    const conversations = new Set(received.map((m: any) => `${m.listing_id}_${m.sender_id}`));

    const { data: replied } = await supabase
      .from('messages')
      .select('listing_id, receiver_id')
      .eq('sender_id', seller_id)
      .neq('receiver_id', seller_id);
    if (!replied) return;

    const repliedConvs = new Set(replied.map((m: any) => `${m.listing_id}_${m.receiver_id}`));
    let repliedCount = 0;
    conversations.forEach((conv) => { if (repliedConvs.has(conv)) repliedCount++; });
    setResponseRate(Math.round((repliedCount / conversations.size) * 100));
  };

  const handleReport = () => {
    if (!user) return;
    Alert.alert(
      'Signaler ce vendeur',
      'Un abus ou un comportement suspect ? Notre équipe examinera ce profil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('reports').insert({
              reporter_id: user.id,
              listing_id: null,
              reason: 'user',
              reported_user_id: seller_id,
            });
            Alert.alert('Signalement envoyé', 'Merci. Notre équipe examinera ce profil dans les plus brefs délais.');
          },
        },
      ],
    );
  };

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  const avatarInitial = (profile?.username ?? '?')[0].toUpperCase();

  const responseBadge = responseRate === null
    ? null
    : responseRate >= 90
      ? { label: 'Répond très vite', color: colors.success }
      : responseRate >= 70
        ? { label: 'Répond souvent', color: colors.primary }
        : responseRate >= 50
          ? { label: 'Répond parfois', color: colors.danger }
          : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil vendeur</Text>
        {user && user.id !== seller_id ? (
          <TouchableOpacity onPress={handleReport} style={styles.reportBtn}>
            <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* Avatar + identité */}
        <View style={styles.heroSection}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
          <Text style={styles.username}>{profile?.username ?? 'Vendeur'}</Text>
          <Text style={styles.memberSince}>Membre depuis {memberSince}</Text>

          {responseBadge && (
            <View style={[styles.responseBadge, { borderColor: responseBadge.color }]}>
              <Ionicons name="flash" size={12} color={responseBadge.color} />
              <Text style={[styles.responseBadgeText, { color: responseBadge.color }]}>{responseBadge.label}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            {rating ? (
              <>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.round(rating.avg) ? 'star' : 'star-outline'}
                      size={14}
                      color={colors.primary}
                    />
                  ))}
                </View>
                <Text style={styles.statValue}>{rating.avg}</Text>
                <Text style={styles.statLabel}>{rating.count} avis</Text>
              </>
            ) : (
              <>
                <Ionicons name="star-outline" size={20} color={colors.textMuted} />
                <Text style={styles.statLabel}>Aucun avis</Text>
              </>
            )}
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{soldCount}</Text>
            <Text style={styles.statLabel}>vendus</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>en vente</Text>
          </View>
        </View>

        {/* Annonces actives */}
        {listings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Annonces en vente</Text>
            <View style={styles.grid}>
              {listings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => navigation.push('Listing', { id: item.id })}
                >
                  {item.images?.[0] ? (
                    <Image source={{ uri: imgUrl(item.images[0], 300) }} style={styles.cardImg} />
                  ) : (
                    <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                      <Ionicons name="image-outline" size={22} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.cardPrice}>{item.price_final} €</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Avis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avis acheteurs</Text>
            {rating && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.ratingPillText}>{rating.avg} / 5</Text>
              </View>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubble-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucun avis pour l'instant</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarInitial}>
                        {(review.reviewer?.username ?? '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewUsername}>{review.reviewer?.username ?? 'Acheteur'}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= review.rating ? 'star' : 'star-outline'}
                        size={13}
                        color={colors.primary}
                      />
                    ))}
                  </View>
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                ) : (
                  <Text style={styles.reviewCommentEmpty}>Aucun commentaire</Text>
                )}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },
  reportBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: spacing.section },

  heroSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 24, gap: 6 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 4 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderStrong,
    marginBottom: 4,
  },
  avatarInitial: { fontFamily: fonts.serif, fontSize: 32, color: colors.primary },
  username: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
  memberSince: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  responseBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: colors.borderStrong },
  starsRow: { flexDirection: 'row', gap: 2 },
  statValue: { fontFamily: fonts.bodySemiBold, fontSize: 18, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary, marginBottom: 14 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingPillText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImg: { width: '100%', height: CARD_WIDTH, backgroundColor: colors.surfaceDeep },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 10 },
  cardName: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  cardPrice: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary, marginTop: 4 },

  emptyReviews: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },

  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarInitial: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  reviewUsername: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  reviewDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  reviewListing: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  reviewComment: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  reviewCommentEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
