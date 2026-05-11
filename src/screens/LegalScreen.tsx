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
  navigation: StackNavigationProp<ProfileStackParamList, 'Legal'>;
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

        <Text style={styles.docTitle}>CONDITIONS GÉNÉRALES D'UTILISATION</Text>
        <Text style={styles.docSubtitle}>Application Pépite</Text>
        <Text style={styles.updated}>Version 1.0 – En vigueur à compter du 11 mai 2026</Text>

        {/* Préambule */}
        <View style={styles.section}>
          <Text style={styles.preambuleTitle}>PRÉAMBULE</Text>
          <Body>
            {'La société Pépite SAS, dont le siège social est situé [ADRESSE] (ci-après « Pépite » ou la « Société »), exploite une application mobile de mise en relation entre particuliers pour la vente d\'objets anciens, de collection et vintage, enrichie d\'un service d\'estimation par intelligence artificielle (ci-après l\'« Application »).\n\nLes présentes Conditions Générales d\'Utilisation (ci-après les « CGU ») ont pour objet de définir les conditions d\'accès et d\'utilisation de l\'Application par toute personne physique (ci-après l\'« Utilisateur »).\n\nPépite agit en qualité d\'intermédiaire de mise en relation et ne saurait être qualifiée de vendeur ou d\'acheteur dans les transactions conclues entre Utilisateurs.'}
          </Body>
        </View>

        {/* Article 1 */}
        <View style={styles.section}>
          <Article number="1" title="Définitions" />
          <Body>
            {'Dans les présentes CGU, les termes suivants ont la signification qui leur est attribuée ci-après :'}
          </Body>
          <Bullets items={[
            'Acheteur : Utilisateur qui procède à l\'acquisition d\'un Objet mis en vente par un Vendeur via la Plateforme.',
            'Annonce : fiche descriptive d\'un Objet publiée par un Vendeur, comprenant photographies, description, prix et conditions de livraison.',
            'Application : application mobile Pépite, disponible sur iOS et Android, ainsi que l\'ensemble des services qui y sont associés.',
            'Commission : rémunération prélevée par Pépite sur chaque transaction conclue entre un Vendeur et un Acheteur.',
            'Compte : espace personnel créé par l\'Utilisateur lors de son inscription sur l\'Application.',
            'Estimation IA : évaluation indicative de la valeur marchande d\'un Objet générée automatiquement par intelligence artificielle.',
            'Objet : bien meuble d\'occasion, ancien, de collection ou vintage proposé à la vente par un Vendeur.',
            'Prix total : somme payée par l\'Acheteur comprenant le prix de l\'Objet et, le cas échéant, les frais de livraison.',
            'Prestataire de paiement : Stripe Payments Europe, Limited, prestataire de services de paiement agréé.',
            'Transaction : opération d\'achat-vente d\'un Objet conclue entre un Vendeur et un Acheteur via la Plateforme.',
            'Utilisateur : toute personne physique majeure ayant créé un Compte sur l\'Application.',
            'Vendeur : Utilisateur qui publie une ou plusieurs Annonces sur la Plateforme en vue de céder un Objet.',
          ]} />
        </View>

        {/* Article 2 */}
        <View style={styles.section}>
          <Article number="2" title="Objet et champ d'application" />
          <Body>
            {'Les présentes CGU ont pour objet de définir les modalités et conditions d\'utilisation de l\'Application et des services proposés par Pépite. Elles s\'appliquent à toute utilisation de l\'Application, quelle qu\'en soit la forme ou le support, à l\'exclusion de tout autre document.\n\nPépite se réserve le droit de proposer des conditions particulières applicables à certains services, lesquelles prévalent sur les présentes CGU en cas de contradiction.'}
          </Body>
        </View>

        {/* Article 3 */}
        <View style={styles.section}>
          <Article number="3" title="Acceptation des CGU" />
          <Body>
            {'L\'accès et l\'utilisation de l\'Application sont subordonnés à l\'acceptation sans réserve des présentes CGU. Cette acceptation est matérialisée lors de la création du Compte par le cochage de la case prévue à cet effet et vaut signature électronique au sens de l\'article 1367 du Code civil.\n\nL\'Utilisateur reconnaît avoir pris connaissance des présentes CGU dans leur intégralité. L\'Utilisateur qui n\'accepte pas les présentes CGU doit s\'abstenir d\'utiliser l\'Application.'}
          </Body>
        </View>

        {/* Article 4 */}
        <View style={styles.section}>
          <Article number="4" title="Inscription et compte utilisateur" />
          <Sub title="4.1 Conditions d'accès">
            {'L\'inscription est réservée aux personnes physiques majeures (18 ans révolus) et juridiquement capables de contracter. Toute inscription par une personne mineure est strictement interdite.\n\nL\'accès à la Plateforme à des fins professionnelles ou commerciales (revente habituelle, activité de brocante professionnelle) est soumis à l\'accord préalable et exprès de Pépite.'}
          </Sub>
          <Sub title="4.2 Création du Compte">
            {'L\'Utilisateur s\'inscrit en fournissant une adresse e-mail valide et en créant un mot de passe sécurisé, ou par authentification via un service tiers (Apple, Google). L\'Utilisateur garantit l\'exactitude des informations fournies.\n\nUn seul Compte est autorisé par personne physique. La création de Comptes multiples est interdite.'}
          </Sub>
          <Sub title="4.3 Sécurité du Compte">
            {'L\'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. En cas de perte, vol ou utilisation non autorisée de son Compte, l\'Utilisateur doit en informer Pépite sans délai à l\'adresse hello@pepite-app.com.'}
          </Sub>
          <Sub title="4.4 Suspension et résiliation du Compte">
            {'À l\'initiative de l\'Utilisateur : la suppression du Compte peut être demandée à tout moment depuis les paramètres de l\'Application. Les transactions en cours doivent être préalablement finalisées.\n\nÀ l\'initiative de Pépite : Pépite se réserve le droit de suspendre ou résilier tout Compte, sans préavis ni indemnité, en cas de violation des présentes CGU, comportement frauduleux, fourniture d\'informations inexactes, ou inactivité prolongée.'}
          </Sub>
        </View>

        {/* Article 5 */}
        <View style={styles.section}>
          <Article number="5" title="Description des services" />
          <Sub title="5.1 Service de scan et d'estimation par IA">
            {'L\'Application propose un service d\'analyse photographique par intelligence artificielle permettant d\'obtenir des informations indicatives relatives à l\'identification d\'un Objet, son époque et son origine estimées, son état de conservation, une fourchette de prix de marché indicative, et des conseils de mise en vente.\n\nL\'Estimation IA est fournie à titre purement indicatif et informatif. Elle ne constitue en aucun cas une évaluation professionnelle ou une garantie de valeur. Pépite ne peut être tenue responsable des erreurs ou imprécisions de l\'Estimation IA.'}
          </Sub>
          <Sub title="5.2 Marketplace C2C">
            {'La Plateforme permet aux Utilisateurs de publier des Annonces et d\'acheter des Objets proposés par d\'autres Utilisateurs. Pépite intervient exclusivement en qualité d\'intermédiaire technique de mise en relation. Elle n\'est pas partie aux contrats de vente conclus entre les Utilisateurs.'}
          </Sub>
          <Sub title="5.3 Service de messagerie">
            {'L\'Application met à disposition un service de messagerie strictement réservé aux échanges relatifs aux Transactions et ne peut être utilisé à des fins publicitaires, commerciales ou contraires aux présentes CGU.'}
          </Sub>
          <Sub title="5.4 Service de paiement et portefeuille">
            {'Pépite met à disposition un service de paiement intégré opéré par Stripe. Le Vendeur doit configurer un compte vendeur via Stripe Connect et accepter les conditions générales de Stripe pour percevoir des paiements.'}
          </Sub>
        </View>

        {/* Article 6 */}
        <View style={styles.section}>
          <Article number="6" title="Conditions de mise en vente" />
          <Sub title="6.1 Publication d'une Annonce">
            {'La publication d\'une Annonce est gratuite. Le Vendeur s\'engage à fournir une description sincère et précise de l\'Objet, des photographies fidèles et représentatives, un prix librement fixé sans pratique trompeuse, les modes de livraison proposés et leurs frais. Le Vendeur garantit être propriétaire de l\'Objet et disposer de tous droits pour en procéder à la cession.'}
          </Sub>
          <Sub title="6.2 Objets autorisés">
            {'La Plateforme est dédiée à la vente d\'objets anciens, de collection, vintage et d\'occasion à titre non professionnel : meubles anciens, objets d\'art, bijoux, argenterie, céramiques, porcelaines, montres, tableaux, livres anciens, vinyles, jouets anciens, appareils photographiques, vêtements et accessoires vintage.'}
          </Sub>
          <Sub title="6.3 Objets interdits">
            {'Sont strictement interdits à la vente :'}
          </Sub>
          <Bullets items={[
            'Objets dont la vente est prohibée ou soumise à autorisation spéciale (armes, drogues, explosifs…)',
            'Objets volés ou dont l\'origine licite ne peut être établie',
            'Contrefaçons ou imitations de marques ou œuvres protégées',
            'Matières premières issues d\'espèces protégées (ivoire, corail…) soumises à la réglementation CITES, sauf autorisation régulière',
            'Biens culturels classés dont la cession est réglementée',
            'Denrées alimentaires, médicaments et produits pharmaceutiques',
            'Tout objet à caractère raciste, pornographique ou contraire à l\'ordre public',
            'Données personnelles, fichiers informatiques ou logiciels piratés',
            'Billets et titres de transport dont la revente est légalement restreinte',
          ]} />
          <Body>
            {'\nCette liste n\'est pas limitative. Pépite se réserve le droit de retirer toute Annonce contraire aux lois applicables ou aux présentes CGU, sans préavis et sans indemnité.'}
          </Body>
        </View>

        {/* Article 7 */}
        <View style={styles.section}>
          <Article number="7" title="Processus d'achat et paiement" />
          <Sub title="7.1 Conclusion de la vente">
            {'La vente est conclue entre le Vendeur et l\'Acheteur au moment où l\'Acheteur procède au paiement du Prix total. À compter de ce moment, le contrat de vente est formé et produit ses effets conformément aux articles 1582 et suivants du Code civil. L\'Annonce est automatiquement retirée du marché à l\'issue du paiement.'}
          </Sub>
          <Sub title="7.2 Paiement sécurisé">
            {'Le paiement est exclusivement réalisé via le service de paiement intégré opéré par Stripe. Pépite ne collecte, ne stocke ni ne traite directement les données de carte bancaire. Les fonds sont disponibles dans le portefeuille du Vendeur, déduction faite de la Commission de Pépite, et peuvent être virés sur son compte bancaire à tout moment.'}
          </Sub>
          <Sub title="7.3 Commission de Pépite">
            {'Pépite perçoit une Commission de 3 % (trois pour cent) du Prix total de chaque Transaction, automatiquement déduite lors du traitement du paiement. La Commission est acquise à Pépite dès la conclusion de la Transaction.'}
          </Sub>
          <Sub title="7.4 Obligations déclaratives – DAC7">
            {'Conformément à la Directive européenne 2021/514/UE (DAC7), Pépite est tenue de déclarer à l\'administration fiscale les informations relatives aux Vendeurs ayant réalisé plus de 30 transactions ou plus de 2 000 € de revenus bruts annuels sur la Plateforme.'}
          </Sub>
        </View>

        {/* Article 8 */}
        <View style={styles.section}>
          <Article number="8" title="Livraison" />
          <Sub title="8.1 Modes de livraison disponibles">
            {'Le Vendeur choisit lors de la publication de son Annonce les modes de livraison qu\'il propose : remise en main propre, Mondial Relay, Colissimo, Chronopost ou tout autre mode disponible. L\'Acheteur sélectionne le mode souhaité lors du processus d\'achat.'}
          </Sub>
          <Sub title="8.2 Obligations du Vendeur">
            {'Le Vendeur s\'engage à expédier l\'Objet vendu dans un délai maximum de 5 (cinq) jours ouvrés suivant la confirmation du paiement, à l\'emballer avec soin, à communiquer le numéro de suivi à l\'Acheteur et à marquer l\'envoi comme expédié sur la Plateforme dès remise au transporteur.'}
          </Sub>
          <Sub title="8.3 Transfert de risques">
            {'Conformément à l\'article 1197 du Code civil, les risques de perte ou de détérioration de l\'Objet sont transférés à l\'Acheteur au moment de la prise en charge par le transporteur ou lors de la remise en main propre. En cas d\'incident de livraison, l\'Acheteur exerce ses recours directement contre le transporteur.'}
          </Sub>
          <Sub title="8.4 Obligations de l'Acheteur">
            {'L\'Acheteur s\'engage à fournir une adresse de livraison exacte et à confirmer la bonne réception de l\'Objet sur la Plateforme dans un délai de 5 (cinq) jours ouvrés suivant la livraison. À défaut de confirmation dans ce délai, la Transaction est réputée acceptée.'}
          </Sub>
        </View>

        {/* Article 9 */}
        <View style={styles.section}>
          <Article number="9" title="Garanties et retours" />
          <Sub title="9.1 Absence de garantie légale de conformité entre particuliers">
            {'Les Transactions conclues sur la Plateforme le sont entre particuliers. En conséquence, la garantie légale de conformité prévue aux articles L. 217-3 et suivants du Code de la consommation, applicable aux seules ventes réalisées par des professionnels, ne s\'applique pas aux ventes entre particuliers via la Plateforme.'}
          </Sub>
          <Sub title="9.2 Garantie des vices cachés">
            {'La garantie des vices cachés prévue aux articles 1641 et suivants du Code civil est applicable aux Transactions. L\'Acheteur qui découvre un vice caché peut rendre l\'Objet et se faire restituer le prix (action rédhibitoire) ou garder l\'Objet et se faire rendre une partie du prix (action estimatoire). L\'action doit être intentée dans un délai de 2 (deux) ans à compter de la découverte du vice. Pépite ne saurait être tenue responsable au titre de la garantie des vices cachés.'}
          </Sub>
          <Sub title="9.3 Politique de retour">
            {'En l\'absence de vice caché, les ventes entre particuliers sont fermes et définitives. Le Vendeur n\'est pas tenu d\'accepter le retour d\'un Objet dont l\'Acheteur se serait simplement ravisé.\n\nEn cas de litige, les parties sont invitées à résoudre leur différend à l\'amiable via la messagerie de la Plateforme. Pépite peut, sans y être obligée, intervenir à titre de médiation sans que cela constitue une reconnaissance de responsabilité.'}
          </Sub>
        </View>

        {/* Article 10 */}
        <View style={styles.section}>
          <Article number="10" title="Droit de rétractation" />
          <Body>
            {'Conformément à l\'article L. 221-3 du Code de la consommation, le droit de rétractation de 14 jours prévu aux articles L. 221-18 et suivants du Code de la consommation ne s\'applique pas aux contrats conclus entre particuliers.\n\nPépite n\'accorde pas contractuellement de droit de rétractation supplémentaire entre Utilisateurs particuliers, sauf accord exprès du Vendeur expressément mentionné dans l\'Annonce.'}
          </Body>
        </View>

        {/* Article 11 */}
        <View style={styles.section}>
          <Article number="11" title="Responsabilités" />
          <Sub title="11.1 Responsabilité de Pépite">
            {'Pépite intervient en qualité d\'intermédiaire technique au sens de la loi n° 2004-575 du 21 juin 2004 (LCEN) et du Règlement (UE) 2022/2065 (DSA). Sa responsabilité ne peut être engagée en raison du contenu des Annonces publiées par les Vendeurs, sauf à avoir eu connaissance de leur caractère illicite et à ne pas avoir agi promptement pour les retirer.\n\nEn tout état de cause, la responsabilité de Pépite est limitée au montant des commissions perçues au titre de la Transaction en cause.\n\nLa responsabilité de Pépite ne saurait être engagée en cas de faute d\'un Utilisateur, d\'inexécution d\'une Transaction, de perte ou détérioration pendant le transport, ou de force majeure au sens de l\'article 1218 du Code civil.'}
          </Sub>
          <Sub title="11.2 Responsabilité des Utilisateurs">
            {'Chaque Utilisateur est pleinement responsable de l\'exactitude et de la licéité du contenu qu\'il publie, du respect de ses obligations contractuelles envers les autres Utilisateurs, de toute utilisation de son Compte, et de la conformité de ses activités avec les lois et règlements applicables.\n\nL\'Utilisateur s\'engage à garantir et indemniser Pépite contre toute réclamation résultant d\'un manquement à ses obligations au titre des présentes CGU.'}
          </Sub>
        </View>

        {/* Article 12 */}
        <View style={styles.section}>
          <Article number="12" title="Propriété intellectuelle" />
          <Sub title="12.1 Droits de Pépite">
            {'L\'Application, son architecture, son code source, sa charte graphique, ses marques et logos sont protégés par les droits de propriété intellectuelle et sont la propriété exclusive de Pépite SAS ou font l\'objet de licences accordées à Pépite. Toute reproduction sans autorisation préalable et écrite de Pépite est strictement interdite.'}
          </Sub>
          <Sub title="12.2 Contenu publié par les Utilisateurs">
            {'En publiant du contenu sur la Plateforme (photographies, descriptions, messages), l\'Utilisateur accorde à Pépite une licence non exclusive, mondiale, gratuite et transférable d\'utiliser, reproduire, adapter et diffuser ce contenu aux seules fins de l\'exploitation de la Plateforme et de la promotion des services de Pépite.\n\nL\'Utilisateur garantit être titulaire de tous les droits nécessaires sur le contenu qu\'il publie et que ce contenu ne porte pas atteinte aux droits de tiers.'}
          </Sub>
        </View>

        {/* Article 13 */}
        <View style={styles.section}>
          <Article number="13" title="Protection des données personnelles" />
          <Sub title="13.1 Responsable de traitement">
            {'Pépite SAS agit en qualité de responsable de traitement au sens du Règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée (loi Informatique et Libertés).'}
          </Sub>
          <Sub title="13.2 Données collectées et finalités">
            {'Pépite collecte et traite les données suivantes :'}
          </Sub>
          <Bullets items={[
            'Identité et e-mail → gestion du Compte (base : exécution du contrat)',
            'Photos des Objets → analyse IA, publication des Annonces (base : exécution du contrat)',
            'Données bancaires via Stripe → traitement des paiements (base : exécution du contrat)',
            'Identité et domicile des vendeurs → conformité LCB-FT et DAC7 (base : obligation légale)',
            'Données de navigation et logs → sécurité et amélioration du service (base : intérêt légitime)',
            'Historique des Transactions → comptabilité et gestion des litiges (base : obligation légale)',
          ]} />
          <Sub title="13.3 Durée de conservation">
            {'Les données sont conservées pour la durée strictement nécessaire à leurs finalités, et au minimum : données de Compte (3 ans après clôture), données de Transaction (10 ans pour obligations comptables), données de modération (1 an après traitement du signalement).'}
          </Sub>
          <Sub title="13.4 Droits des Utilisateurs">
            {'Conformément au RGPD, tout Utilisateur dispose des droits d\'accès, de rectification, d\'effacement, de limitation du traitement, de portabilité, d\'opposition et de ne pas faire l\'objet d\'une décision entièrement automatisée.\n\nCes droits peuvent être exercés par e-mail à hello@pepite-app.com. L\'Utilisateur peut également introduire une réclamation auprès de la CNIL (www.cnil.fr).'}
          </Sub>
          <Sub title="13.5 Transferts hors UE">
            {'Les données peuvent être transférées vers des pays tiers dans le cadre de l\'utilisation de prestataires tels que Stripe ou les services d\'hébergement. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types, décision d\'adéquation).'}
          </Sub>
        </View>

        {/* Article 14 */}
        <View style={styles.section}>
          <Article number="14" title="Modération et signalements" />
          <Sub title="14.1 Signalement de contenus illicites">
            {'Conformément aux articles 16 et suivants du Règlement DSA, tout Utilisateur peut signaler à Pépite un contenu ou comportement illicite ou contraire aux présentes CGU via la fonctionnalité de signalement intégrée à l\'Application. Pépite examine tout signalement dans un délai raisonnable et prend les mesures appropriées.'}
          </Sub>
          <Sub title="14.2 Décision de modération">
            {'L\'Utilisateur dont le Compte est suspendu ou dont l\'Annonce est retirée en est informé et peut contester la décision en contactant le service client à hello@pepite-app.com.'}
          </Sub>
          <Sub title="14.3 Abus de signalement">
            {'Tout Utilisateur qui effectuerait des signalements manifestement infondés ou de mauvaise foi s\'expose à la suspension de son Compte.'}
          </Sub>
        </View>

        {/* Article 15 */}
        <View style={styles.section}>
          <Article number="15" title="Modifications des CGU" />
          <Body>
            {'Pépite se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs sont informés de toute modification substantielle par notification au sein de l\'Application au moins 15 (quinze) jours avant l\'entrée en vigueur des nouvelles CGU. L\'utilisation de l\'Application postérieurement à leur entrée en vigueur vaut acceptation.'}
          </Body>
        </View>

        {/* Article 16 */}
        <View style={styles.section}>
          <Article number="16" title="Médiation de la consommation" />
          <Body>
            {'Conformément aux articles L. 612-1 et suivants du Code de la consommation, tout Utilisateur consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d\'un litige l\'opposant à Pépite.\n\nLe médiateur désigné par Pépite est : [NOM DU MÉDIATEUR] – [ADRESSE – SITE WEB].\n\nLa saisine du médiateur ne peut intervenir qu\'après une réclamation préalable adressée au service client de Pépite restée sans réponse satisfaisante dans un délai de 2 mois.'}
          </Body>
        </View>

        {/* Article 17 */}
        <View style={styles.section}>
          <Article number="17" title="Loi applicable et juridiction" />
          <Body>
            {'Les présentes CGU sont régies par le droit français. En cas de litige, les parties s\'efforceront de trouver une solution amiable préalablement à toute action en justice. À défaut, les litiges impliquant des Utilisateurs consommateurs seront soumis aux juridictions compétentes conformément aux règles du Code de procédure civile.'}
          </Body>
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactText}>Pour toute question : hello@pepite-app.com</Text>
          <Text style={styles.contactText}>Pépite SAS – [ADRESSE]</Text>
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
