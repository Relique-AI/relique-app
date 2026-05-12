import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'PrivacyPolicy'>;
};

function Article({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.articleHeader}>
      <Text style={styles.articleNumber}>Article {number}</Text>
      <Text style={styles.articleTitle}>{title}</Text>
    </View>
  );
}

function Sub({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.sub}>
      <Text style={styles.subTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function TableRow({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{left}</Text>
      <Text style={[styles.tableCell, styles.tableCellRight]}>{right}</Text>
    </View>
  );
}

export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Politique de confidentialité</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.docTitle}>POLITIQUE DE CONFIDENTIALITÉ</Text>
        <Text style={styles.docSubtitle}>Application Pépite</Text>
        <Text style={styles.updated}>Version 1.0 – En vigueur à compter du 12 mai 2026</Text>

        {/* Préambule */}
        <View style={styles.section}>
          <Text style={styles.preambuleTitle}>PRÉAMBULE</Text>
          <Body>
            {'La présente Politique de Confidentialité décrit la manière dont Pépite SAS (ci-après « Pépite », « nous » ou « notre »), société dont le siège social est situé [ADRESSE], collecte, utilise, conserve et protège les données personnelles des utilisateurs de l\'application mobile Pépite (ci-après l\'« Application »).\n\nPépite s\'engage à traiter vos données personnelles dans le strict respect du Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée (loi Informatique et Libertés).'}
          </Body>
        </View>

        {/* Article 1 */}
        <View style={styles.section}>
          <Article number="1" title="Responsable de traitement" />
          <Body>
            {'Le responsable du traitement des données personnelles collectées via l\'Application est :\n\nPépite SAS\n[ADRESSE COMPLÈTE]\nE-mail : hello@pepite-app.com\n\nPour toute question relative à la présente Politique ou à l\'exercice de vos droits, contactez-nous à hello@pepite-app.com'}
          </Body>
        </View>

        {/* Article 2 */}
        <View style={styles.section}>
          <Article number="2" title="Données collectées" />
          <Sub title="2.1 Données que vous nous fournissez directement">
            {''}
          </Sub>
          <Bullets items={[
            'Identité : prénom, nom (optionnel), nom d\'utilisateur — lors de la création de compte',
            'Contact : adresse e-mail — création de compte et notifications',
            'Authentification : mot de passe (haché), identifiant Apple / Google — connexion',
            'Photo de profil : avatar optionnel — édition du profil',
            'Annonces : photographies des objets, description, prix, localisation optionnelle — publication d\'annonces',
            'Coordonnées de livraison : adresse postale — achat avec envoi postal',
            'Informations bancaires vendeur : IBAN, identité complète, adresse (via Stripe) — onboarding vendeur / KYC',
            'Messages : contenu des échanges via la messagerie in-app',
            'Avis : note et commentaire — publication d\'un avis vendeur',
            'Signalements : motif et contenu signalé — signalement d\'annonce',
            'Code de parrainage : code utilisé à l\'inscription',
          ]} />
          <Sub title="2.2 Données collectées automatiquement">
            {''}
          </Sub>
          <Bullets items={[
            'Technique : type d\'appareil, système d\'exploitation, version de l\'app',
            'Identifiants : identifiant unique de l\'appareil, token de notification push',
            'Logs : adresse IP, horodatage des connexions, actions effectuées',
            'Performance : erreurs applicatives, temps de chargement',
          ]} />
          <Sub title="2.3 Données issues de tiers">
            {'Lorsque vous vous connectez via Apple Sign In ou Google Sign In, nous recevons un identifiant unique et, selon vos paramètres, votre adresse e-mail. Nous ne recevons pas votre mot de passe.'}
          </Sub>
        </View>

        {/* Article 3 */}
        <View style={styles.section}>
          <Article number="3" title="Finalités et bases légales" />
          <Bullets items={[
            'Création et gestion du Compte → Exécution du contrat (art. 6.1.b)',
            'Scan et estimation IA des objets → Exécution du contrat (art. 6.1.b)',
            'Publication et gestion des annonces → Exécution du contrat (art. 6.1.b)',
            'Traitement des paiements → Exécution du contrat (art. 6.1.b)',
            'Vérification d\'identité vendeur (KYC) → Obligation légale LCB-FT (art. 6.1.c)',
            'Déclarations fiscales DAC7 → Obligation légale (art. 6.1.c)',
            'Service de messagerie → Exécution du contrat (art. 6.1.b)',
            'Envoi de notifications push → Consentement (art. 6.1.a)',
            'Modération et traitement des signalements → Intérêt légitime (art. 6.1.f)',
            'Prévention de la fraude et sécurité → Intérêt légitime (art. 6.1.f)',
            'Amélioration du service → Intérêt légitime (art. 6.1.f)',
            'Gestion des litiges → Intérêt légitime (art. 6.1.f)',
            'Obligations comptables → Obligation légale (art. 6.1.c)',
          ]} />
        </View>

        {/* Article 4 */}
        <View style={styles.section}>
          <Article number="4" title="Le service d'estimation par intelligence artificielle" />
          <Body>
            {'Lorsque vous utilisez la fonctionnalité Scanner, les photographies que vous prenez sont transmises à Anthropic, PBC (Claude API) aux seules fins d\'analyse et d\'estimation.\n\nCe que vous devez savoir :'}
          </Body>
          <Bullets items={[
            'Les photographies sont transmises via une API sécurisée et ne sont pas conservées par Anthropic à l\'issue du traitement.',
            'Pépite ne vend ni ne partage ces photographies à des fins commerciales ou publicitaires.',
            'Les résultats d\'analyse sont conservés dans votre Compte pour vous permettre de finaliser votre annonce.',
            'Évitez de photographier des documents d\'identité, données bancaires ou informations sensibles.',
          ]} />
          <Body>
            {'\nPolitique de confidentialité d\'Anthropic : anthropic.com/privacy'}
          </Body>
        </View>

        {/* Article 5 */}
        <View style={styles.section}>
          <Article number="5" title="Destinataires et sous-traitants" />
          <Sub title="5.1 Autres utilisateurs de la Plateforme">
            {'Dans le cadre du fonctionnement de la Plateforme, votre nom d\'utilisateur, photo de profil, note moyenne et annonces publiées sont visibles publiquement. Votre adresse de livraison est communiquée au Vendeur uniquement lors d\'un achat avec envoi postal. Vos messages sont visibles uniquement par leur destinataire.\n\nVotre adresse e-mail, coordonnées bancaires et identité complète ne sont jamais communiqués à d\'autres utilisateurs.'}
          </Sub>
          <Sub title="5.2 Sous-traitants techniques">
            {''}
          </Sub>
          <Bullets items={[
            'Supabase, Inc. — base de données, authentification, stockage, fonctions serveur (USA/EU)',
            'Stripe Payments Europe, Ltd. — traitement des paiements, KYC vendeurs (USA/Irlande)',
            'Anthropic, PBC — analyse IA des photographies (USA)',
            'Expo / EAS (650 Industries) — distribution et build de l\'Application (USA)',
            'Apple Inc. — notifications push (APNS), distribution iOS (USA)',
            'Google LLC — notifications push (FCM), distribution Android (USA)',
          ]} />
          <Sub title="5.3 Autorités et obligations légales">
            {'Pépite peut être amenée à communiquer vos données aux autorités compétentes (judiciaires, fiscales, de contrôle) lorsque la loi l\'exige.'}
          </Sub>
        </View>

        {/* Article 6 */}
        <View style={styles.section}>
          <Article number="6" title="Transferts hors Espace Économique Européen" />
          <Body>
            {'Certains sous-traitants étant situés aux États-Unis, vos données peuvent être transférées en dehors de l\'EEE. Ces transferts sont encadrés par des clauses contractuelles types (CCT) adoptées par la Commission européenne (décision 2021/914/UE), garantissant un niveau de protection équivalent à celui offert au sein de l\'EEE.'}
          </Body>
        </View>

        {/* Article 7 */}
        <View style={styles.section}>
          <Article number="7" title="Durée de conservation" />
          <Bullets items={[
            'Données de Compte actif → durée de la relation contractuelle',
            'Données de Compte après clôture → 3 ans',
            'Annonces et photos associées → durée de la relation + 3 ans',
            'Données de Transaction → 10 ans (obligation comptable)',
            'Données KYC vendeur → 5 ans après fin de la relation (LCB-FT)',
            'Messages → 3 ans à compter de l\'envoi',
            'Logs de connexion et sécurité → 12 mois',
            'Données de modération → 12 mois après clôture du dossier',
            'Tokens de notification push → durée du Compte ou jusqu\'à révocation',
          ]} />
          <Body>
            {'\nÀ l\'expiration de ces délais, les données sont supprimées ou anonymisées de manière irréversible.'}
          </Body>
        </View>

        {/* Article 8 */}
        <View style={styles.section}>
          <Article number="8" title="Vos droits" />
          <Body>
            {'Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :'}
          </Body>
          <Bullets items={[
            'Droit d\'accès (art. 15) : obtenir une copie des données vous concernant.',
            'Droit de rectification (art. 16) : faire corriger des données inexactes ou incomplètes.',
            'Droit à l\'effacement (art. 17) : obtenir la suppression de vos données, sous réserve des obligations légales de conservation.',
            'Droit à la limitation (art. 18) : suspendre temporairement le traitement dans certains cas.',
            'Droit à la portabilité (art. 20) : recevoir vos données dans un format structuré et lisible par machine.',
            'Droit d\'opposition (art. 21) : vous opposer à un traitement fondé sur l\'intérêt légitime.',
            'Droit de ne pas faire l\'objet d\'une décision entièrement automatisée (art. 22).',
            'Droit de retirer votre consentement à tout moment, sans que cela affecte la licéité des traitements antérieurs.',
          ]} />
          <Body>
            {'\nComment exercer vos droits : envoyez un e-mail à hello@pepite-app.com avec la mention « Exercice de droits RGPD » et une copie d\'un justificatif d\'identité. Pépite s\'engage à répondre dans un délai d\'1 mois.\n\nDroit de réclamation : si vous estimez que le traitement de vos données n\'est pas conforme au RGPD, vous pouvez introduire une réclamation auprès de la CNIL :\n• En ligne : cnil.fr\n• Par courrier : CNIL, 3 Place de Fontenoy – TSA 80715, 75334 Paris Cedex 07'}
          </Body>
        </View>

        {/* Article 9 */}
        <View style={styles.section}>
          <Article number="9" title="Sécurité des données" />
          <Body>
            {'Pépite met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :'}
          </Body>
          <Bullets items={[
            'Chiffrement en transit : toutes les communications sont chiffrées via TLS 1.2+.',
            'Chiffrement au repos : les données stockées sont chiffrées.',
            'Hachage des mots de passe : jamais stockés en clair.',
            'Authentification forte : accès internes protégés par MFA.',
            'Contrôle d\'accès : accès aux données personnelles limité aux personnes habilitées.',
            'Stockage sécurisé sur l\'appareil : jetons d\'authentification stockés dans l\'enclave sécurisée (Keychain iOS / Keystore Android).',
          ]} />
          <Body>
            {'\nEn cas de violation de données susceptible d\'engendrer un risque pour vos droits, Pépite s\'engage à notifier la CNIL dans les 72 heures et, si le risque est élevé, à vous en informer directement.'}
          </Body>
        </View>

        {/* Article 10 */}
        <View style={styles.section}>
          <Article number="10" title="Données des mineurs" />
          <Body>
            {'L\'Application est strictement réservée aux personnes âgées de 18 ans et plus. Pépite ne collecte pas sciemment de données concernant des mineurs. Si vous avez connaissance qu\'un mineur nous a fourni des données, contactez-nous à hello@pepite-app.com afin que nous procédions à leur suppression immédiate.'}
          </Body>
        </View>

        {/* Article 11 */}
        <View style={styles.section}>
          <Article number="11" title="Notifications push" />
          <Body>
            {'L\'Application peut vous envoyer des notifications push (messages, questions sur vos annonces, confirmation de vente, etc.). Ces notifications nécessitent votre consentement, demandé lors de la première utilisation.\n\nVous pouvez révoquer ce consentement à tout moment :\n• iOS : Réglages > Notifications > Pépite\n• Android : Paramètres > Applications > Pépite > Notifications\n\nLa révocation n\'affecte pas l\'accès aux autres fonctionnalités de l\'Application.'}
          </Body>
        </View>

        {/* Article 12 */}
        <View style={styles.section}>
          <Article number="12" title="Cookies et traceurs" />
          <Body>
            {'L\'Application mobile Pépite n\'utilise pas de cookies au sens traditionnel du terme. Des identifiants techniques (tokens de session, identifiants d\'appareil) sont utilisés pour assurer le fonctionnement de l\'Application et sont stockés localement sur votre appareil.\n\nSi Pépite venait à intégrer des outils d\'analytics utilisant des traceurs, la présente Politique serait mise à jour et votre consentement serait sollicité conformément à la réglementation ePrivacy.'}
          </Body>
        </View>

        {/* Article 13 */}
        <View style={styles.section}>
          <Article number="13" title="Modifications de la présente Politique" />
          <Body>
            {'Pépite se réserve le droit de modifier la présente Politique à tout moment. Toute modification substantielle sera notifiée via l\'Application ou par e-mail au moins 15 jours avant son entrée en vigueur. L\'utilisation de l\'Application après l\'entrée en vigueur des modifications vaut acceptation de la nouvelle Politique.'}
          </Body>
        </View>

        {/* Article 14 */}
        <View style={styles.section}>
          <Article number="14" title="Contact" />
          <Body>
            {'Pour toute question relative à la présente Politique ou pour exercer vos droits :\n\nPar e-mail : hello@pepite-app.com\nPar courrier : Pépite SAS – [ADRESSE COMPLÈTE] – À l\'attention du Responsable de la Protection des Données'}
          </Body>
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactText}>hello@pepite-app.com</Text>
          <Text style={styles.contactText}>Pépite SAS — [ADRESSE]</Text>
        </View>

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
  scroll: { padding: spacing.section, paddingBottom: 64 },

  docTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  docSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  updated: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },

  section: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    paddingBottom: 28,
  },
  preambuleTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  articleHeader: { marginBottom: 12 },
  articleNumber: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  articleTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },

  sub: { marginBottom: 12 },
  subTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primary,
    marginBottom: 6,
  },

  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  bulletList: { marginTop: 6, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 9,
    flexShrink: 0,
  },
  bulletText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  tableCell: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tableCellRight: { color: colors.textPrimary },

  contact: {
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    gap: 4,
  },
  contactText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
