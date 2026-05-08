import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Wallet'>;
};

export function WalletScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState(false);
  const [stats, setStats] = useState({ sales: 0, pending: 0, total: 0 });

  const loadData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_onboarded')
      .eq('id', user.id)
      .single();
    setOnboarded(!!profile?.stripe_onboarded);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, fee, status')
      .eq('seller_id', user.id);

    if (transactions) {
      const completed = transactions.filter((t) => t.status === 'completed');
      const total = completed.reduce((sum, t) => sum + (t.amount - t.fee) / 100, 0);
      setStats({
        sales: completed.length,
        pending: transactions.filter((t) => t.status === 'pending').length,
        total,
      });
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [user]));

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Mon portefeuille</Text>
          <Text style={styles.subtitle}>Suivi de vos revenus</Text>
        </View>

        {/* Solde principal */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total gagné</Text>
          <Text style={styles.balanceValue}>{stats.total.toFixed(2)} €</Text>
          {!onboarded && (
            <Text style={styles.balanceNote}>Configurez vos paiements pour recevoir des virements</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Ventes" value={String(stats.sales)} icon="bag-check-outline" />
          <StatCard label="En cours" value={String(stats.pending)} icon="hourglass-outline" />
          <StatCard label="Net gagné" value={`${stats.total.toFixed(0)} €`} icon="trending-up-outline" />
        </View>

        {/* Onboarding Stripe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recevoir des paiements</Text>
          {onboarded ? (
            <View style={styles.onboardedCard}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.onboardedTitle}>Compte Stripe actif</Text>
                <Text style={styles.onboardedText}>
                  Vous recevrez automatiquement vos paiements après chaque vente (3 % de commission Pépite).
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Pour recevoir vos paiements directement sur votre compte bancaire, configurez votre compte vendeur Stripe. Cela prend environ 5 minutes.
              </Text>
              <TouchableOpacity
                style={styles.stripeBtn}
                onPress={() => navigation.navigate('StripeOnboarding')}
                activeOpacity={0.85}
              >
                <Ionicons name="card-outline" size={18} color={colors.background} />
                <Text style={styles.stripeBtnText}>Configurer mes paiements</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Commission info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          <View style={styles.stepsCard}>
            {[
              'Publiez votre objet via l\'onglet Scanner.',
              'Un acheteur paie directement dans l\'app.',
              `Pépite prélève 3 % de commission, le reste vous est viré automatiquement.`,
            ].map((text, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletText}>{i + 1}</Text>
                </View>
                <Text style={styles.infoText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.primary },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  balanceCard: {
    margin: spacing.section,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.2)',
  },
  balanceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary, letterSpacing: 1 },
  balanceValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.primary, marginVertical: 8 },
  balanceNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.section,
    gap: 10,
    marginBottom: spacing.section,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: spacing.section, marginBottom: spacing.section },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  infoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  stepsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 16 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoBullet: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  infoBulletText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.background },
  infoText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },

  onboardedCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.25)',
  },
  onboardedTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  onboardedText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  referralCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.2)',
  },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  referralLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.textDisabled, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  referralCode: { fontFamily: fonts.serif, fontSize: 26, color: colors.primary, letterSpacing: 3 },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.background },
  referralDivider: { height: 1, backgroundColor: colors.background, marginVertical: 14 },
  referralStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referralStatText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },

  stripeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stripeBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.background },
});
