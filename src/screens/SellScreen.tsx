import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AnalysisResult } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Sell'>;
  route: RouteProp<RootStackParamList, 'Sell'>;
};

const CONDITIONS: AnalysisResult['condition'][] = [
  'Excellent', 'Bon', 'Correct', 'À restaurer',
];

async function uploadPhoto(
  photoUri: string,
  userId: string,
  token: string,
): Promise<string> {
  const fileName = `${userId}/${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append('file', {
    uri: photoUri,
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
  const { analysis, photo } = route.params;
  const { user, session } = useAuth();

  const [name, setName] = useState(analysis.name);
  const [category, setCategory] = useState(analysis.category);
  const [condition, setCondition] = useState<AnalysisResult['condition']>(analysis.condition);
  const [description, setDescription] = useState(analysis.story);
  const [price, setPrice] = useState(String(analysis.priceSuggested));
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!user || !session) return;

    setLoading(true);
    try {
      await supabase.rpc('ensure_profile');
      const imageUrl = await uploadPhoto(photo.uri, user.id, session.access_token);

      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
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
        images: [imageUrl],
        status: 'active',
        location: location.trim() || null,
      });

      if (error) throw error;

      Alert.alert(
        'Annonce publiée !',
        'Votre objet est maintenant visible sur le marché.',
        [{
          text: 'Voir le marché',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
        }],
      );
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Aperçu photo */}
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />

          {/* Nom */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de l'objet</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Catégorie */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholderTextColor={colors.textSecondary}
            />
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
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Prix */}
          <View style={styles.field}>
            <Text style={styles.label}>Prix de vente (€)</Text>
            <Text style={styles.priceGuide}>
              Estimation IA : {analysis.priceMin} € — {analysis.priceMax} €
            </Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Localisation */}
          <View style={styles.field}>
            <Text style={styles.label}>Localisation (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex : Paris, Lyon..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* CTA */}
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
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
      </KeyboardAvoidingView>
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
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  field: { paddingHorizontal: spacing.section, paddingTop: spacing.base },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
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
  ctaBar: {
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    paddingBottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
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
});
