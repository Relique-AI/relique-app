import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Legal'>;
};

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

export function LegalScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mentions légales & CGU</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.updated}>Dernière mise à jour : avril 2026</Text>

        <Section title="1. Présentation de l'application">
          Pépite est une application mobile qui permet à chacun de scanner, estimer et vendre ses objets en quelques minutes grâce à l'intelligence artificielle. Elle est éditée par Pépite SAS.
        </Section>

        <Section title="2. Conditions d'utilisation">
          En utilisant Pépite, vous acceptez les présentes conditions. L'application est réservée aux personnes majeures. Tout contenu frauduleux, illégal ou offensant est interdit et peut entraîner la suppression du compte.
        </Section>

        <Section title="3. Inscription et compte">
          L'accès aux fonctionnalités de l'application nécessite la création d'un compte avec une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants. Pépite se réserve le droit de suspendre tout compte en cas d'abus.
        </Section>

        <Section title="4. Annonces et transactions">
          Les vendeurs sont seuls responsables du contenu de leurs annonces et de l'exactitude des informations (description, état, prix). Pépite est un intermédiaire et n'est pas partie aux transactions entre utilisateurs. Une commission de 3 % sera prélevée sur chaque transaction lors de l'activation des paiements intégrés.
        </Section>

        <Section title="5. Signalement et modération">
          Tout utilisateur peut signaler une annonce suspecte ou inappropriée. L'équipe Pépite se réserve le droit de retirer toute annonce ne respectant pas les présentes conditions.
        </Section>

        <Section title="6. Données personnelles">
          Vos données sont stockées de manière sécurisée via Supabase. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@pepite-app.fr
        </Section>

        <Section title="7. Propriété intellectuelle">
          L'ensemble des éléments de l'application (logo, design, textes, code) est la propriété exclusive de Pépite SAS. Toute reproduction sans autorisation est interdite.
        </Section>

        <Section title="8. Limitation de responsabilité">
          Pépite ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation de l'application, d'une indisponibilité du service, ou d'une transaction entre utilisateurs.
        </Section>

        <Section title="9. Contact">
          Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à : contact@pepite-app.fr
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  title: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: spacing.section, paddingBottom: 48 },
  updated: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.section,
    textAlign: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  sectionBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
