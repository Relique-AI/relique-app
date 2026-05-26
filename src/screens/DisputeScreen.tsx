import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'DisputeScreen'>;
  route: RouteProp<ProfileStackParamList, 'DisputeScreen'>;
};

type Reason = 'not_received' | 'not_as_described' | 'damaged' | 'other';

const REASONS: { id: Reason; label: string; icon: string; desc: string }[] = [
  {
    id: 'not_received',
    label: 'Objet non reçu',
    icon: 'cube-outline',
    desc: 'Je n\'ai pas reçu mon colis',
  },
  {
    id: 'not_as_described',
    label: 'Non conforme',
    icon: 'alert-circle-outline',
    desc: 'L\'objet ne correspond pas à l\'annonce',
  },
  {
    id: 'damaged',
    label: 'Endommagé',
    icon: 'construct-outline',
    desc: 'L\'objet est arrivé abîmé',
  },
  {
    id: 'other',
    label: 'Autre',
    icon: 'ellipsis-horizontal-circle-outline',
    desc: 'Autre problème',
  },
];

export function DisputeScreen({ navigation, route }: Props) {
  const { transaction_id, listing_name, amount } = route.params;
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = reason !== null && description.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    Alert.alert(
      'Confirmer le litige',
      'Voulez-vous ouvrir un litige pour cette commande ? Le vendeur sera notifié et notre équipe examinera votre demande.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ouvrir le litige',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const session = (await supabase.auth.getSession()).data.session;
              const { data, error } = await supabase.functions.invoke('open-dispute', {
                body: { transaction_id, reason, description: description.trim() },
                headers: { Authorization: `Bearer ${session?.access_token}` },
              });

              if (error || data?.error) {
                Alert.alert('Erreur', data?.error ?? error?.message ?? 'Impossible d\'ouvrir le litige.');
                return;
              }

              Alert.alert(
                'Litige ouvert',
                'Votre litige a été enregistré. Nous l\'examinerons dans les plus brefs délais et vous notifierons de notre décision.',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
              );
            } catch (err: any) {
              Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Signaler un problème</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Récap commande */}
          <View style={styles.orderCard}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderName} numberOfLines={1}>{listing_name}</Text>
              <Text style={styles.orderAmount}>{(amount / 100).toFixed(2)} €</Text>
            </View>
          </View>

          {/* Délai */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Protection acheteur · Délai de signalement : <Text style={{ color: colors.primary }}>7 jours</Text> après la transaction
            </Text>
          </View>

          {/* Motif */}
          <Text style={styles.sectionTitle}>Quel est le problème ?</Text>
          <View style={styles.reasonsGrid}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.reasonCard, reason === r.id && styles.reasonCardActive]}
                onPress={() => setReason(r.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={r.icon as any}
                  size={22}
                  color={reason === r.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.reasonLabel, reason === r.id && styles.reasonLabelActive]}>
                  {r.label}
                </Text>
                <Text style={styles.reasonDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Décrivez le problème</Text>
          <AppTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Expliquez le problème en détail (minimum 20 caractères). Plus vous êtes précis, plus vite nous pourrons vous aider."
            multiline
            numberOfLines={5}
            style={styles.textArea}
          />
          <Text style={[styles.charCount, description.length < 20 && description.length > 0 && { color: colors.danger }]}>
            {description.length} / 20 min
          </Text>

          {/* Avertissement */}
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.warningText}>
              Les faux litiges peuvent entraîner la suspension de votre compte. Assurez-vous d'avoir d'abord tenté de résoudre le problème avec le vendeur.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitText}>Ouvrir le litige</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.section, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary },
  scroll: { padding: spacing.section, paddingBottom: 20 },

  orderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  orderInfo: { flex: 1 },
  orderName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  orderAmount: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: `${colors.primary}12`, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: `${colors.primary}25`, marginBottom: 20,
  },
  infoText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  sectionTitle: {
    fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary,
    marginBottom: 12,
  },

  reasonsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24,
  },
  reasonCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start',
  },
  reasonCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  reasonLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary,
    marginTop: 8, marginBottom: 2,
  },
  reasonLabelActive: { color: colors.primary },
  reasonDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, lineHeight: 15 },

  textArea: { minHeight: 110, textAlignVertical: 'top', color: colors.textPrimary },
  charCount: {
    fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary,
    textAlign: 'right', marginTop: 4, marginBottom: 16,
  },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  warningText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },

  footer: {
    padding: spacing.section, paddingBottom: spacing.section,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.danger, borderRadius: 50, paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.background },
});
