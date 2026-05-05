import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'EditListing'>;
  route: RouteProp<ProfileStackParamList, 'EditListing'>;
};

export function EditListingScreen({ navigation, route }: Props) {
  const { id } = route.params;

  const [listing, setListing] = useState<Listing | null>(null);
  const [price, setPrice] = useState('');
  const [story, setStory] = useState('');
  const [location, setLocation] = useState('');
  const [shippingPrice, setShippingPrice] = useState('0');
  const [tipsOpen, setTipsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadListing();
  }, []);

  const loadListing = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      const l = data as Listing;
      setListing(l);
      setPrice(String(l.price_final));
      setStory(l.story ?? '');
      setLocation(l.location ?? '');
      setShippingPrice(String(l.shipping_price ?? 0));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Prix invalide', 'Veuillez saisir un prix valide.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('listings')
      .update({
        price_final: parsedPrice,
        story: story.trim(),
        location: location.trim() || null,
        shipping_price: parseFloat(shippingPrice.replace(',', '.')) || 0,
      })
      .eq('id', id);
    setSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      navigation.goBack();
    }
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
        <Text style={styles.errorText}>Annonce introuvable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Barre */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier l'annonce</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Aperçu photo + nom (non modifiables) */}
          <View style={styles.previewCard}>
            {listing.images?.[0] ? (
              <Image source={{ uri: listing.images[0] }} style={styles.previewImg} />
            ) : (
              <View style={[styles.previewImg, styles.previewImgPlaceholder]}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName} numberOfLines={2}>{listing.name}</Text>
              <Text style={styles.previewMeta}>{listing.category} · {listing.era}</Text>
            </View>
          </View>

          {/* Prix */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prix de vente (€)</Text>
            <View style={styles.priceWrap}>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.priceSymbol}>€</Text>
            </View>
            <Text style={styles.fieldHint}>
              Estimation IA : {listing.price_min} – {listing.price_max} €
              (suggéré {listing.price_suggested} €)
            </Text>
          </View>

          {/* Histoire */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Histoire de l'objet</Text>
            <TextInput
              style={styles.textArea}
              value={story}
              onChangeText={setStory}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Décrivez l'histoire ou l'origine de cet objet..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Localisation */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Localisation (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex : Paris 11e, Lyon..."
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
            />
          </View>

          {/* Prix livraison */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prix de livraison (€)</Text>
            <View style={styles.priceWrap}>
              <TextInput
                style={styles.priceInput}
                value={shippingPrice}
                onChangeText={setShippingPrice}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.priceSymbol}>€</Text>
            </View>
            <Text style={styles.fieldHint}>0 = livraison gratuite</Text>
          </View>

          {/* Conseils de vente IA */}
          {(listing.selling_tips?.length ?? 0) > 0 && (
            <View style={styles.fieldGroup}>
              <TouchableOpacity
                style={styles.tipsHeader}
                onPress={() => setTipsOpen((o) => !o)}
                activeOpacity={0.7}
              >
                <Text style={styles.label}>Conseils de vente IA</Text>
                <Ionicons
                  name={tipsOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {tipsOpen && (
                <View style={styles.tipsList}>
                  {listing.selling_tips!.map((tip: string, i: number) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Info champs non éditables */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Le nom, la catégorie, l'époque et l'état sont générés par l'IA et ne peuvent pas être modifiés.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary, textAlign: 'center', margin: spacing.section },
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
  saveBtn: { paddingHorizontal: 4, height: 48, justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },

  scroll: { padding: spacing.section, gap: 24, paddingBottom: 40 },

  previewCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 12,
    alignItems: 'center',
  },
  previewImg: { width: 64, height: 64, borderRadius: 10, resizeMode: 'cover' },
  previewImgPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, lineHeight: 19 },
  previewMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4 },

  fieldGroup: { gap: 8 },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    paddingHorizontal: 14,
  },
  priceInput: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    paddingVertical: 14,
  },
  priceSymbol: { fontFamily: fonts.serif, fontSize: 22, color: colors.primary },
  fieldHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
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
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    minHeight: 120,
  },
  tipsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipsList: { marginTop: 10, gap: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  tipText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 19 },
});
