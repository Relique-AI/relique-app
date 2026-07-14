import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Wallet'>;
};

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function WalletScreen({ navigation }: Props) {
  const { user, session } = useAuth();
  const [onboarded, setOnboarded] = useState(false);
  const [stats, setStats] = useState({ sales: 0, pending: 0, total: 0 });
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [loadingPayout, setLoadingPayout] = useState(false);

  const loadData = async () => {
    if (!user || !session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_onboarded, stripe_account_id')
      .eq('id', user.id)
      .single();

    let isOnboarded = !!profile?.stripe_onboarded;
    if (!isOnboarded && profile?.stripe_account_id) {
      const { data: syncData } = await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { check_only: true },
      });
      if (syncData?.onboarded) isOnboarded = true;
    }
    setOnboarded(isOnboarded);

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

    if (isOnboarded) {
      const { data } = await supabase.functions.invoke('get-stripe-balance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (data) setBalance({ available: data.available ?? 0, pending: data.pending ?? 0 });
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [user]));

  const handlePayout = async () => {
    if (!session) return;
    Alert.alert(
      'Virer mes fonds',
      `Virer ${(balance.available / 100).toFixed(2)} € sur votre compte bancaire ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoadingPayout(true);
            try {
              const { data, error } = await supabase.functions.invoke('request-payout', {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (error || data?.error) {
                let msg = 'Impossible de lancer le virement.';
                try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch {}
                if (data?.error) msg = data.error;
                Alert.alert('Erreur', msg);
              } else {
                Alert.alert('Virement lancé', 'Vous recevrez vos fonds sous 1-2 jours ouvrés sur votre IBAN.');
                loadData();
              }
            } finally {
              setLoadingPayout(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Mon portefeuille</Text>
          <Text style={styles.subtitle}>Suivi de vos revenus</Text>
        </View>

        {/* Solde Stripe */}
        {onboarded ? (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>DISPONIBLE</Text>
            <Text style={styles.balanceValue}>{(balance.available / 100).toFixed(2)} €</Text>
            {balance.pending > 0 && (
              <View style={styles.pendingBlock}>
                <View style={styles.pendingRow}>
                  <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.pendingAmount}>{(balance.pending / 100).toFixed(2)} € en cours de traitement</Text>
                </View>
                <Text style={styles.pendingExplain}>
                  Stripe retient les fonds 7 jours après chaque vente (délai de sécurité standard). Ils rejoindront automatiquement votre solde disponible passé ce délai.
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.payoutBtn, (balance.available <= 0 || loadingPayout) && styles.payoutBtnDisabled]}
              onPress={handlePayout}
              disabled={balance.available <= 0 || loadingPayout}
              activeOpacity={0.85}
            >
              {loadingPayout
                ? <ActivityIndicator color={colors.background} size="small" />
                : (
                  <>
                    <Ionicons name="arrow-down-circle-outline" size={18} color={colors.background} />
                    <Text style={styles.payoutBtnText}>Virer sur mon compte</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>TOTAL GAGNÉ</Text>
            <Text style={styles.balanceValue}>{stats.total.toFixed(2)} €</Text>
            <Text style={styles.balanceNote}>Configurez vos paiements pour recevoir des virements</Text>
          </View>
        )}

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
                  Vos paiements sont virés automatiquement sur votre IBAN.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('StripeOnboarding')}
                style={styles.editBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
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

        {/* Comment ça marche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          <View style={styles.stepsCard}>
            {[
              "Publiez votre objet via l'onglet Scanner.",
              'Un acheteur paie directement dans l\'app.',
              'Virez vos fonds sur votre compte bancaire en un clic.',
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
    gap: 8,
  },
  balanceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textSecondary, letterSpacing: 2 },
  balanceValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.primary },
  pendingBlock: {
    backgroundColor: 'rgba(245,184,46,0.07)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.15)',
    width: '100%',
  },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingAmount: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  pendingExplain: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  balanceNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },

  payoutBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payoutBtnDisabled: { opacity: 0.4 },
  payoutBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.section,
    gap: 10,
    marginBottom: spacing.section,
  },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: spacing.section, marginBottom: spacing.section },
  sectionTitle: {
    fontFamily: fonts.mono, fontSize: 11, color: colors.primaryDim,
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12,
  },
  infoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  stepsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 16 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoBullet: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  infoBulletText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.background },
  infoText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },

  onboardedCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)',
  },
  onboardedTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  onboardedText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  editBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  stripeBtn: {
    backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  stripeBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.background },

  success: '#4CAF50',
});
