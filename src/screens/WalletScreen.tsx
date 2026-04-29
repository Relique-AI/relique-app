import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme';

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function WalletScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Mon portefeuille</Text>
          <Text style={styles.subtitle}>Suivi de vos revenus</Text>
        </View>

        {/* Solde principal */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceValue}>0,00 €</Text>
          <Text style={styles.balanceNote}>Bientôt disponible</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Ventes" value="0" icon="bag-check-outline" />
          <StatCard label="En cours" value="0" icon="hourglass-outline" />
          <StatCard label="Total gagné" value="0 €" icon="trending-up-outline" />
        </View>

        {/* Commission info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>1</Text>
              </View>
              <Text style={styles.infoText}>Publiez votre objet via l'onglet Scanner.</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>2</Text>
              </View>
              <Text style={styles.infoText}>Un acheteur vous contacte et vous concluez la vente.</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>3</Text>
              </View>
              <Text style={styles.infoText}>
                Pépite prélève une commission de <Text style={styles.highlight}>3 %</Text> sur chaque transaction pour maintenir la plateforme.
              </Text>
            </View>
          </View>
        </View>

        {/* Coming soon */}
        <View style={styles.comingSoon}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.textSecondary} />
          <Text style={styles.comingSoonTitle}>Paiements intégrés</Text>
          <Text style={styles.comingSoonText}>
            La gestion des paiements en ligne arrivera prochainement. Pour l'instant, les transactions se font directement entre acheteur et vendeur.
          </Text>
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
    borderColor: 'rgba(201,168,76,0.2)',
  },
  balanceLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary, letterSpacing: 1 },
  balanceValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.primary, marginVertical: 8 },
  balanceNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },

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
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  infoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 16 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  infoBulletText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.background },
  infoText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },
  highlight: { fontFamily: fonts.bodySemiBold, color: colors.primary },

  comingSoon: {
    marginHorizontal: spacing.section,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surface,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  comingSoonTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  comingSoonText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
