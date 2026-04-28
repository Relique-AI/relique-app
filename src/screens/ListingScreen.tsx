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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MarketStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { AnalysisResult } from '../types';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'Listing'>;
  route: RouteProp<MarketStackParamList, 'Listing'>;
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

  const isOwner = listing?.seller_id === user?.id;

  useEffect(() => {
    loadListing();
    loadFavorite();
  }, [id]);

  const loadListing = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, created_at)')
      .eq('id', id)
      .single();
    if (data) setListing(data as Listing);
    setLoading(false);
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

          {/* Indicateurs */}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Bouton retour */}
          <SafeAreaView style={styles.photoOverlay}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayBtn} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorited ? '#E57373' : '#fff'}
              />
            </TouchableOpacity>
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
            </View>
          </View>

        </View>
      </ScrollView>

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
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
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
