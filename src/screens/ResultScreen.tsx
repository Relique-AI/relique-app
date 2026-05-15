import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AnalysisResult } from '../types';
import { colors, fonts, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const { height } = Dimensions.get('window');
const SECTION_COUNT = 5;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
  route: RouteProp<RootStackParamList, 'Result'>;
};

const CONDITION_COLORS: Record<AnalysisResult['condition'], string> = {
  Excellent: '#B5D479',
  Bon:       '#C9A9DB',
  Correct:   '#F5B82E',
  'À restaurer': '#E08766',
};

function Chip({ label }: { label: string }) {
  return (
    <View style={chipStyles.container}>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.chipBackground,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export function ResultScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { analysis, photos, memory } = route.params;
  const { isGuest, exitGuestMode, user, session } = useAuth();
  const [tipsOpen, setTipsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clarifyContext, setClarifyContext] = useState('');

  // Animation de glissement vers le haut
  const slideAnim = useRef(new Animated.Value(height * 0.6)).current;
  // Animations de fondu séquentielles par section
  const fadeAnims = useRef(
    Array.from({ length: SECTION_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Glissement au printemps depuis le bas
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 55,
      friction: 11,
      useNativeDriver: true,
    }).start();

    // Fondu séquentiel des sections
    const fadeSequence = fadeAnims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(200 + i * 200),
        Animated.timing(anim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(fadeSequence).start();
  }, []);

  const handleSave = async () => {
    if (isGuest) {
      Alert.alert(
        'Compte requis',
        'Créez un compte gratuit pour sauvegarder vos estimations.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: "S'inscrire", onPress: exitGuestMode },
        ],
      );
      return;
    }
    if (!user || !session || saving) return;
    setSaving(true);
    try {
      const photoUrls = await Promise.all(
        photos.map(async (photo, i) => {
          const fileName = `drafts/${user.id}/${Date.now()}_${i}.jpg`;
          const formData = new FormData();
          formData.append('file', { uri: photo.uri, type: 'image/jpeg', name: `photo_${i}.jpg` } as any);
          const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/listing-images/${fileName}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
            },
            body: formData,
          });
          if (!res.ok) throw new Error('Upload photo échoué');
          const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          return data.publicUrl;
        }),
      );
      const { error } = await supabase.from('saved_estimations').insert({
        user_id: user.id,
        analysis,
        photo_urls: photoUrls,
      });
      if (error) throw error;
      Alert.alert(
        'Estimation sauvegardée !',
        'Retrouvez-la dans votre profil sous "Brouillons" pour la mettre en vente quand vous le souhaitez.',
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de sauvegarder l\'estimation.');
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyse = () => {
    navigation.navigate('Loading', { photos, memory: clarifyContext.trim() });
  };

  const handleSell = () => {
    if (isGuest) {
      Alert.alert(
        'Compte requis',
        'Créez un compte gratuit pour publier vos annonces sur Pépite.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: "S'inscrire", onPress: exitGuestMode },
        ],
      );
      return;
    }
    navigation.navigate('Sell', { analysis, photos });
  };

  const handleRestart = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'Camera' }],
    });
  };

  const conditionColor = CONDITION_COLORS[analysis.condition] ?? colors.primary;

  if (analysis.unsellable) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.cardContainer, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnims[0] }}>
              <Image source={{ uri: photos[0].uri }} style={styles.heroImage} />
            </Animated.View>
            <Animated.View style={[styles.section, styles.humourCard, { opacity: fadeAnims[1] }]}>
              <Text style={styles.humourIcon}>✦</Text>
              <Text style={styles.humourText}>{analysis.humourMessage}</Text>
            </Animated.View>
            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleRestart} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View
        style={[styles.cardContainer, { transform: [{ translateY: slideAnim }] }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image héro */}
          <Animated.View style={{ opacity: fadeAnims[0] }}>
            <Image source={{ uri: photos[0].uri }} style={styles.heroImage} />
          </Animated.View>

          {/* Bloc identité */}
          <Animated.View style={[styles.section, { opacity: fadeAnims[1] }]}>
            <Text style={styles.objectName}>{analysis.name}</Text>
            <View style={styles.chips}>
              <Chip label={analysis.category} />
              <Chip label={analysis.era} />
              <Chip label={analysis.origin} />
            </View>
          </Animated.View>

          {/* Disclaimer montres */}
          {analysis.category === 'Horlogerie' && (
            <Animated.View style={[styles.section, { opacity: fadeAnims[1] }]}>
              <View style={styles.disclaimerCard}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                  L'authenticité d'une montre ne peut être certifiée que par un expert horloger. Cette estimation est indicative.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bloc histoire */}
          <Animated.View style={[styles.section, { opacity: fadeAnims[2] }]}>
            <Text style={styles.sectionLabel}>Son histoire</Text>
            <Text style={styles.storyText}>{analysis.story}</Text>
          </Animated.View>

          <View style={styles.divider} />

          {/* Bloc état */}
          <Animated.View style={[styles.section, { opacity: fadeAnims[3] }]}>
            <Text style={styles.sectionLabel}>État de conservation</Text>
            <View
              style={[
                styles.conditionBadge,
                { backgroundColor: conditionColor + '22' },
              ]}
            >
              <Text style={[styles.conditionText, { color: conditionColor }]}>
                {analysis.condition}
              </Text>
            </View>
            <Text style={styles.conditionNote}>{analysis.conditionNote}</Text>
          </Animated.View>

          <View style={styles.divider} />

          {/* Bloc prix */}
          <Animated.View style={[styles.priceCard, { opacity: fadeAnims[4] }]}>
            <Text style={styles.priceLabel}>Valeur estimée</Text>
            <Text style={styles.priceRange}>
              {analysis.priceMin} € — {analysis.priceMax} €
            </Text>
            <Text style={styles.priceSuggested}>
              Prix conseillé : {analysis.priceSuggested} €
            </Text>
            <Text style={styles.disclaimer}>
              Estimation basée sur le marché actuel
            </Text>
          </Animated.View>

          {/* Accordéon conseils */}
          <Animated.View style={[styles.section, { opacity: fadeAnims[4] }]}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setTipsOpen((o) => !o)}
              activeOpacity={0.7}
            >
              <Text style={styles.accordionTitle}>Conseils pour mieux vendre</Text>
              <Ionicons
                name={tipsOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {tipsOpen && (
              <View style={styles.accordionContent}>
                {analysis.sellingTips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Questions de clarification */}
          {(analysis.clarifyingQuestions ?? []).length > 0 && (
            <Animated.View style={[styles.section, { opacity: fadeAnims[4] }]}>
              <View style={styles.clarifyCard}>
                  <View style={styles.clarifyHeader}>
                    <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                    <Text style={styles.clarifyTitle}>Pour affiner l'estimation</Text>
                  </View>
                  {analysis.clarifyingQuestions!.map((q, i) => (
                    <Text key={i} style={styles.clarifyQ}>• {q}</Text>
                  ))}
                  <Text style={styles.clarifyInputLabel}>Vos réponses</Text>
                  <TextInput
                    style={styles.clarifyInput}
                    value={clarifyContext}
                    onChangeText={setClarifyContext}
                    placeholder="Ex : marque Hermès, acheté en 1985 à Paris, héritage familial..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.clarifyBtn, !clarifyContext.trim() && { opacity: 0.4 }]}
                    onPress={handleReanalyse}
                    disabled={!clarifyContext.trim()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={14} color={colors.background} />
                    <Text style={styles.clarifyBtnText}>Relancer l'analyse</Text>
                  </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Espace pour la barre fixe */}
          <View style={{ height: 120 + insets.bottom }} />
        </ScrollView>
      </Animated.View>

      {/* Barre d'actions fixe */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.75}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
              <Text style={styles.saveText}>Sauvegarder</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRestart}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryText}>Recommencer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSell}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>Mettre en vente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  section: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.section,
  },
  objectName: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.textPrimary,
    marginBottom: 14,
    lineHeight: 38,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.section,
    marginTop: spacing.section,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  storyText: {
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  conditionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  conditionNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  humourCard: {
    margin: spacing.section,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.section,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.2)',
    alignItems: 'center',
    gap: 16,
  },
  humourIcon: {
    fontSize: 40,
    color: colors.primary,
  },
  humourText: {
    fontFamily: fonts.serifRegular,
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 28,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.section,
    marginTop: spacing.section,
    borderRadius: 22,
    padding: spacing.section,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.2)',
  },
  priceLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
  },
  priceRange: {
    fontFamily: fonts.serif,
    fontSize: 38,
    color: colors.primary,
    marginBottom: 6,
    lineHeight: 48,
  },
  priceSuggested: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.55,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    marginTop: spacing.section,
  },
  accordionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  accordionContent: {
    gap: 12,
    paddingBottom: spacing.base,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 21,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  disclaimerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  clarifyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.15)',
  },
  clarifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  clarifyTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  clarifyQ: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  clarifyInputLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  clarifyInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.25)',
  },
  clarifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 12,
    marginTop: 4,
  },
  clarifyBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: spacing.section,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.background,
  },
});
