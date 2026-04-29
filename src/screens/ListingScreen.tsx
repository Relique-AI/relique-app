import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { ReviewModal } from '../components/ReviewModal';
import { AnalysisResult } from '../types';

type Props = {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<{ Listing: { id: string } }, 'Listing'>;
};

const { width } = Dimensions.get('window');

function InfoChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function ListingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAsSold, setMarkingAsSold] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [sellerRating, setSellerRating] = useState<{ avg: number; count: number } | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isOwner = listing?.seller_id === user?.id;

  useEffect(() => {
    setLoading(true);
    setPhotoIndex(0);
    setSellerListings([]);
    loadListing();
    loadFavorite();
  }, [id]);

  const loadListing = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, created_at)')
      .eq('id', id)
      .single();
    if (data) {
      setListing(data as Listing);
      loadSellerListings(data.seller_id);
      loadSellerRating(data.seller_id);
    }
    setLoading(false);
  };

  const loadSellerRating = async (sellerId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setSellerRating({ avg: Math.round(avg * 10) / 10, count: data.length });
    }
    if (user) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('reviewer_id', user.id)
        .eq('listing_id', id)
        .maybeSingle();
      setAlreadyReviewed(!!existing);
    }
  };

  const loadSellerListings = async (sellerId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSellerListings(data as Listing[]);
  };

  const loadFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .maybeSingle();
    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    setIsFavorited((prev) => !prev);
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id });
    }
  };

  const markAsSold = async () => {
    Alert.alert(
      'Marquer comme vendu',
      'Cet objet sera retiré du marché. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setMarkingAsSold(true);
            const { error } = await supabase
              .from('listings')
              .update({ status: 'sold' })
              .eq('id', id);
            setMarkingAsSold(false);
            if (!error) {
              Alert.alert('Vendu !', 'Votre annonce a été marquée comme vendue.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            }
          },
        },
      ],
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Signaler cette annonce',
      'Pourquoi signalez-vous cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Contenu inapproprié',
          onPress: () => submitReport('inappropriate'),
        },
        {
          text: 'Arnaque / Fraude',
          onPress: () => submitReport('scam'),
        },
        {
          text: 'Objet interdit',
          onPress: () => submitReport('prohibited'),
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!listing) return;
    await Share.share({
      title: listing.name,
      message:
        `${listing.name} — ${listing.price_final} €\n` +
        `${listing.category} · ${listing.era}\n\n` +
        `Découvre cette annonce sur Pépite !`,
    });
  };

  const submitReport = async (reason: string) => {
    if (!user) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      listing_id: id,
      reason,
    });
    Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner cette annonce.');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.root}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.loader}>
          <Text style={styles.errorText}>Annonce introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = listing.images ?? [];
  const sellerName = listing.profiles?.username ?? 'Vendeur';
  const publishedAt = new Date(listing.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const condition = listing.condition as AnalysisResult['condition'];
  const tips = listing.selling_tips ?? [];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Carrousel photos */}
        <View style={styles.photoSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {images.length > 0 ? images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            )) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              </View>
            )}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <SafeAreaView style={styles.photoOverlay}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.overlayRight}>
              <TouchableOpacity style={styles.overlayBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              {!isOwner && (
                <TouchableOpacity style={styles.overlayBtn} onPress={handleReport}>
                  <Ionicons name="flag-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.overlayBtn} onPress={toggleFavorite}>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorited ? '#E57373' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Corps */}
        <View style={styles.body}>

          {/* Nom + prix */}
          <Text style={styles.name}>{listing.name}</Text>
          <Text style={styles.price}>{listing.price_final} €</Text>

          {/* Chips infos */}
          <View style={styles.chips}>
            {!!listing.category && <InfoChip label={listing.category} />}
            {!!listing.era && <InfoChip label={listing.era} />}
            {!!listing.origin && <InfoChip label={listing.origin} />}
          </View>

          {/* État */}
          <View style={styles.row}>
            <ConditionBadge condition={condition} />
            {!!listing.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.locationText}>{listing.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Histoire */}
          {!!listing.story && (
            <>
              <Text style={styles.sectionLabel}>Histoire de l'objet</Text>
              <Text style={styles.storyText}>{listing.story}</Text>
              <View style={styles.divider} />
            </>
          )}

          {/* Conseils IA */}
          {tips.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Conseils de vente IA</Text>
              <View style={styles.tipsList}>
                {tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Vendeur */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <Text style={styles.sellerDate}>Publié le {publishedAt}</Text>
              {sellerRating && (
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.round(sellerRating.avg) ? 'star' : 'star-outline'}
                      size={13}
                      color={colors.primary}
                    />
                  ))}
                  <Text style={styles.ratingText}>{sellerRating.avg} ({sellerRating.count} avis)</Text>
                </View>
              )}
            </View>
            {!isOwner && listing.status === 'sold' && !alreadyReviewed && (
              <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
                <Text style={styles.reviewBtnText}>Laisser un avis</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Autres annonces du vendeur */}
          {sellerListings.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Autres annonces de {sellerName}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellerListingsScroll}>
                {sellerListings.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.sellerCard}
                    activeOpacity={0.75}
                    onPress={() => navigation.push('Listing', { id: item.id })}
                  >
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.sellerCardImg} />
                    ) : (
                      <View style={[styles.sellerCardImg, styles.sellerCardImgPlaceholder]}>
                        <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.sellerCardName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.sellerCardPrice}>{item.price_final} €</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

        </View>
      </ScrollView>

      {listing && (
        <ReviewModal
          visible={showReviewModal}
          sellerId={listing.seller_id}
          sellerName={sellerName}
          listingId={listing.id}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            setShowReviewModal(false);
            setAlreadyReviewed(true);
            loadSellerRating(listing.seller_id);
          }}
        />
      )}

      {/* Barre d'actions */}
      <SafeAreaView style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {isOwner ? (
          <TouchableOpacity
            style={[styles.btnSold, markingAsSold && { opacity: 0.6 }]}
            onPress={markAsSold}
            disabled={markingAsSold}
          >
            {markingAsSold
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.btnSoldText}>Marquer comme vendu</Text>
            }
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.btnFav} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorited ? '#E57373' : colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnContact}
              onPress={() =>
                navigation.navigate('Chat', {
                  listing_id: listing.id,
                  receiver_id: listing.seller_id,
                  listing_name: listing.name,
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.background} style={{ marginRight: 8 }} />
              <Text style={styles.btnContactText}>Contacter le vendeur</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary },
  backBtn: { padding: spacing.base },

  photoSection: { position: 'relative' },
  photo: { width, height: width * 1.05, resizeMode: 'cover' },
  photoPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.chipBackground },
  dotActive: { width: 18, backgroundColor: colors.primary },

  body: { paddingHorizontal: spacing.section, paddingTop: spacing.section },
  name: { fontFamily: fonts.serif, fontSize: 28, color: colors.textPrimary, lineHeight: 36, marginBottom: 6 },
  price: { fontFamily: fonts.serif, fontSize: 36, color: colors.primary, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: colors.chipBackground, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.surface, marginVertical: spacing.section },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  storyText: { fontFamily: fonts.serifRegular, fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
  tipsList: { gap: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  tipText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  sellerDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginLeft: 2 },
  reviewBtn: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reviewBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },

  // Autres annonces du vendeur
  sellerListingsScroll: { marginHorizontal: -spacing.section, paddingHorizontal: spacing.section },
  sellerCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
  },
  sellerCardImg: { width: 140, height: 140, resizeMode: 'cover' },
  sellerCardImgPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  sellerCardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 8,
    paddingBottom: 2,
    lineHeight: 18,
  },
  sellerCardPrice: {
    fontFamily: fonts.serif,
    fontSize: 15,
    color: colors.primary,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.section,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  btnFav: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  btnContact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnContactText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
  btnSold: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSoldText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: '#fff' },
});
