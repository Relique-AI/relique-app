import { useState, useRef, useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTextInput } from '../components/AppTextInput';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AnalysisResult, CapturedPhoto } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import NotificationPromptModal from '../components/NotificationPromptModal';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { ConditionBadge } from '../components/ConditionBadge';
import { PARCEL_SIZES as PARCEL_SIZES_DATA } from '../utils/shippingRates';

const { width } = Dimensions.get('window');

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Sell'>;
  route: RouteProp<RootStackParamList, 'Sell'>;
};

const CONDITIONS: AnalysisResult['condition'][] = [
  'Excellent', 'Bon', 'Correct', 'À restaurer',
];

const CATEGORIES = [
  'Mobilier', 'Arts décoratifs', 'Bijoux', 'Argenterie',
  'Céramique & Porcelaine', 'Horlogerie', 'Tableaux & Gravures',
  'Livres & BD', 'Jouets & Jeux', 'Vintage & Mode',
  'Appareils photo', 'Vinyles & Musique',
  'Informatique & Électronique', 'Téléphones & Tablettes',
  'Consoles & Jeux vidéo', 'Électroménager', 'Sport & Loisirs',
  'Instruments de musique', 'Véhicules & Accessoires', 'Divers',
];

const SHIPPING_OPTIONS = [
  { id: 'hand',       label: 'Remise en main propre' },
  { id: 'colissimo',  label: 'Colissimo' },
  { id: 'chronopost', label: 'Chronopost' },
];

const PARCEL_SIZES = PARCEL_SIZES_DATA;

async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

async function uploadPhoto(
  photoUri: string,
  userId: string,
  token: string,
): Promise<string> {
  const compressed = await compressPhoto(photoUri);
  const fileName = `${userId}/${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append('file', {
    uri: compressed,
    type: 'image/jpeg',
    name: `${Date.now()}.jpg`,
  } as any);

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/listing-images/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload échoué : ${body}`);
  }

  const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
  return data.publicUrl;
}

export function SellScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { analysis, photos: initialPhotos, preUploadedPhotoUrls, recognitionSessionId } = route.params;
  const { user, session } = useAuth();
  const posthog = usePostHog();
  const { promptContext, isDenied, promptIfNeeded, onAccept, onDismiss } = useNotificationPermission();

  const isPreUploaded = !!(preUploadedPhotoUrls?.length);
  const [photos, setPhotos] = useState<CapturedPhoto[]>(
    isPreUploaded
      ? preUploadedPhotoUrls!.map(url => ({ uri: url, base64: '' }))
      : initialPhotos,
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [name, setName] = useState(analysis.name);
  const [category, setCategory] = useState(analysis.category);
  const [condition, setCondition] = useState<AnalysisResult['condition']>(analysis.condition);
  const [description, setDescription] = useState(analysis.story);
  const [price, setPrice] = useState(String(analysis.priceSuggested));
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ label: string; value: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [descriptionY, setDescriptionY] = useState(0);

  useEffect(() => {
    return () => { if (locationSearchTimeout.current) clearTimeout(locationSearchTimeout.current); };
  }, []);

  const [shippingOptions, setShippingOptions] = useState<string[]>(['hand']);
  const [parcelSize, setParcelSize] = useState('s');

  const hasPostal = shippingOptions.some(o => o !== 'hand');
  const [tipsOpen, setTipsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLocationChange = (text: string) => {
    setLocation(text);
    if (locationSearchTimeout.current) clearTimeout(locationSearchTimeout.current);
    if (text.length < 2) { setLocationSuggestions([]); setShowSuggestions(false); return; }
    locationSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=6&addressdetails=1&countrycodes=fr`,
          { headers: { 'User-Agent': 'Pepite-App/1.0' } },
        );
        const json = await res.json();
        const seen = new Set<string>();
        const suggestions = (json as any[])
          .map((r) => {
            const city = r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.address?.hamlet || '';
            const postcode = r.address?.postcode ?? '';
            if (!city) return null;
            const value = postcode ? `${city} (${postcode})` : city;
            if (seen.has(value)) return null;
            seen.add(value);
            return { label: value, value };
          })
          .filter(Boolean) as Array<{ label: string; value: string }>;
        setLocationSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {}
    }, 350);
  };

  const selectSuggestion = (s: { label: string; value: string }) => {
    setLocation(s.value);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const toggleShipping = (id: string) => {
    setShippingOptions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const deletePhoto = () => {
    if (photos.length <= 1) {
      Alert.alert('Photo requise', 'Vous devez conserver au moins une photo.');
      return;
    }
    Alert.alert('Supprimer cette photo ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          setPhotos((prev) => {
            const next = prev.filter((_, i) => i !== activePhotoIndex);
            setActivePhotoIndex((idx) => Math.min(idx, next.length - 1));
            return next;
          });
        },
      },
    ]);
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un nom pour l\'objet.');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Prix invalide', 'Veuillez saisir un prix valide.');
      return;
    }
    doPublish(priceNum);
  };

  const doPublish = async (priceNum: number) => {
    if (!user || !session) return;

    setLoading(true);
    try {
      await supabase.rpc('ensure_profile');
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      const imageUrls = isPreUploaded
        ? photos.map(p => p.uri)
        : await Promise.all(photos.map(p => uploadPhoto(p.uri, user.id, session.access_token)));

      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        country: sellerProfile?.country ?? 'FR',
        name: name.trim(),
        category: category.trim(),
        era: analysis.era,
        origin: analysis.origin,
        condition,
        condition_note: analysis.conditionNote,
        story: description.trim(),
        price_min: analysis.priceMin,
        price_max: analysis.priceMax,
        price_suggested: analysis.priceSuggested,
        price_final: priceNum,
        selling_tips: analysis.sellingTips,
        images: imageUrls,
        status: 'active',
        location: location.trim() || null,
        shipping_options: shippingOptions,
        shipping_price: 0,
        parcel_size: hasPostal ? parcelSize : null,
      });

      if (error) throw error;

      posthog?.capture('listing_published', {
        recognition_session_id: recognitionSessionId ?? null,
        was_draft_first: false,
        price: priceNum,
        shipping_options: shippingOptions,
        has_location: !!location.trim(),
      });

      const navigateToMarket = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        navigation.getParent()?.navigate('Marché');
      };

      const modalShown = await promptIfNeeded('listing', navigateToMarket);
      if (!modalShown) navigateToMarket();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as any)?.message ?? JSON.stringify(err);
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mettre en vente</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Aperçu photos */}
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActivePhotoIndex(idx);
              }}
            >
              {photos.map((photo, i) => (
                <Image key={i} source={{ uri: photo.uri }} style={styles.photoPreview} />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>{activePhotoIndex + 1} / {photos.length}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.deletePhotoBtn} onPress={deletePhoto}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Nom */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de l'objet</Text>
            <AppTextInput
              style={styles.input}
              value={name}
              onChangeText={setName}

            />
          </View>

          {/* Catégorie */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* État */}
          <View style={styles.field}>
            <Text style={styles.label}>État</Text>
            <View style={styles.conditionRow}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionChipText, condition === c && styles.conditionChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.field} onLayout={(e) => setDescriptionY(e.nativeEvent.layout.y)}>
            <Text style={styles.label}>Description</Text>
            <AppTextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => scrollRef.current?.scrollTo({ y: descriptionY, animated: true })}
            />
          </View>

          {/* Conseils pour mieux vendre */}
          {analysis.sellingTips.length > 0 && (
            <View style={styles.tipsSection}>
              <TouchableOpacity
                style={styles.tipsAccordionHeader}
                onPress={() => setTipsOpen((o) => !o)}
                activeOpacity={0.7}
              >
                <Text style={styles.tipsAccordionTitle}>Conseils pour mieux vendre</Text>
                <Ionicons
                  name={tipsOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {tipsOpen && (
                <View style={styles.tipsAccordionContent}>
                  {analysis.sellingTips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Prix */}
          <View style={styles.field}>
            <Text style={styles.label}>Prix de vente (€)</Text>
            <Text style={styles.priceGuide}>
              Estimation IA : {analysis.priceMin} € — {analysis.priceMax} €
            </Text>
            <AppTextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"

            />
          </View>

          {/* Livraison */}
          <View style={styles.field}>
            <Text style={styles.label}>Modes de livraison</Text>
            <Text style={styles.shippingSubtitle}>Sélectionnez les options que vous proposez à l'acheteur</Text>
            {SHIPPING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.shippingRow, shippingOptions.includes(opt.id) && styles.shippingRowActive]}
                onPress={() => toggleShipping(opt.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.shippingCheck, shippingOptions.includes(opt.id) && styles.shippingCheckActive]}>
                  {shippingOptions.includes(opt.id) && (
                    <Ionicons name="checkmark" size={13} color={colors.background} />
                  )}
                </View>
                <Text style={[styles.shippingLabel, shippingOptions.includes(opt.id) && styles.shippingLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Format du colis */}
          {hasPostal && (
            <View style={styles.field}>
              <Text style={styles.label}>Format du colis</Text>
              <Text style={styles.shippingSubtitle}>Détermine le tarif de livraison affiché à l'acheteur</Text>
              {PARCEL_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[styles.shippingRow, parcelSize === size.id && styles.shippingRowActive]}
                  onPress={() => setParcelSize(size.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.shippingCheck, parcelSize === size.id && styles.shippingCheckActive]}>
                    {parcelSize === size.id && (
                      <Ionicons name="checkmark" size={13} color={colors.background} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shippingLabel, parcelSize === size.id && styles.shippingLabelActive]}>
                      {size.label}
                    </Text>
                    <Text style={styles.shippingDetail}>{size.detail}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Localisation */}
          <View style={styles.field}>
            <Text style={styles.label}>Localisation</Text>
            <View style={{ zIndex: 100 }}>
              <AppTextInput
                style={styles.input}
                value={location}
                onChangeText={handleLocationChange}
                placeholder="Ex : Paris, Lyon..."
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && (
                <View style={styles.suggestionsBox}>
                  {locationSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggestionRow, i < locationSuggestions.length - 1 && styles.suggestionRowBorder]}
                      onPress={() => selectSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={14} color={colors.primary} />
                      <Text style={styles.suggestionText}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>


          {/* Publier */}
          <View style={[styles.publishSection, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handlePublish}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.ctaText}>Publier l'annonce</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NotificationPromptModal context={promptContext} isDenied={isDenied} onAccept={onAccept} onDismiss={onDismiss} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },
  content: { paddingBottom: 16 },
  photoPreview: {
    width,
    height: 220,
    resizeMode: 'cover',
  },
  photoCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: {
    color: '#fff',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  deletePhotoBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    padding: 8,
  },
  field: { paddingHorizontal: spacing.section, paddingTop: spacing.base },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDisabled,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  conditionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conditionChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  conditionChipTextActive: {
    color: colors.background,
    fontFamily: fonts.bodySemiBold,
  },
  priceGuide: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 8,
    opacity: 0.8,
  },
  publishSection: {
    paddingHorizontal: spacing.section,
    paddingTop: 24,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.background },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  categoryChipTextActive: { color: colors.background, fontFamily: fonts.bodySemiBold },

  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.3)',
    zIndex: 200,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  suggestionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.background },
  suggestionText: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary, flex: 1 },

  shippingSubtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  shippingRowActive: { borderColor: colors.primary },
  shippingCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  shippingLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  shippingLabelActive: { color: colors.textPrimary },
  shippingDetail: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  tipsSection: { paddingHorizontal: spacing.section },
  tipsAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    marginTop: spacing.section,
  },
  tipsAccordionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  tipsAccordionContent: {
    gap: 12,
    paddingBottom: spacing.base,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  tipText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },
});
