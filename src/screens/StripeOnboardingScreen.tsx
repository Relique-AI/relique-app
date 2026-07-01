import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'StripeOnboarding'>;
};

type BusinessType = 'individual' | 'company';

export function StripeOnboardingScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!session || !businessType) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { business_type: businessType },
      });

      if (error || !data?.url) {
        Alert.alert('Erreur', 'Impossible de démarrer la configuration. Réessayez.');
        return;
      }

      await WebBrowser.openAuthSessionAsync(data.url, 'pepite://');

      // Vérification du statut après retour de Stripe
      await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { check_only: true },
      });

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recevoir des paiements</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Vous vendez en tant que…</Text>
        <Text style={styles.subtitle}>
          Stripe a besoin de cette information pour configurer correctement votre compte.
        </Text>

        <TouchableOpacity
          style={[styles.typeCard, businessType === 'individual' && styles.typeCardSelected]}
          onPress={() => setBusinessType('individual')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconWrap}>
            <Ionicons name="person-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.typeCardContent}>
            <Text style={styles.typeCardTitle}>Particulier</Text>
            <Text style={styles.typeCardDesc}>Vous vendez vos objets personnels à titre privé.</Text>
          </View>
          {businessType === 'individual' && (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, businessType === 'company' && styles.typeCardSelected]}
          onPress={() => setBusinessType('company')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconWrap}>
            <Ionicons name="business-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.typeCardContent}>
            <Text style={styles.typeCardTitle}>Professionnel</Text>
            <Text style={styles.typeCardDesc}>Vous vendez via une structure (auto-entrepreneur, SASU, SARL…)</Text>
          </View>
          {businessType === 'company' && (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            La vérification est gérée par Stripe. Vos données ne sont jamais stockées sur nos serveurs.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (!businessType || loading) && styles.btnDisabled]}
          onPress={handleStart}
          disabled={!businessType || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.background} />
            : <Text style={styles.btnText}>Continuer</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.section, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },

  content: { flex: 1, paddingHorizontal: spacing.section, paddingTop: 40, gap: 16 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 8 },

  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  typeCardSelected: { borderColor: colors.primary },
  typeIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(245,184,46,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeCardContent: { flex: 1, gap: 4 },
  typeCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },
  typeCardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  infoBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(245,184,46,0.06)',
    borderRadius: 12, padding: 14, marginTop: 8,
  },
  infoText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  footer: { padding: spacing.section, paddingBottom: 8 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
});
