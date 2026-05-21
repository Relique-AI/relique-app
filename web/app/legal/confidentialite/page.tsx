import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Pépite",
};

export default function ConfidentialitePage() {
  return (
    <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
      <div>
        <h1 className="font-serif text-4xl text-text-primary mb-2">Politique de confidentialité</h1>
        <p className="text-text-muted text-xs">Dernière mise à jour : mai 2025</p>
      </div>

      <Section title="1. Responsable du traitement">
        <p>
          Le responsable du traitement de vos données personnelles est Pépite SAS, dont le siège social est situé en France.
          Pour toute question relative à vos données, contactez-nous à : <strong className="text-text-primary">privacy@pepite.app</strong>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong className="text-text-primary">Données d'identification</strong> : adresse email, nom d'utilisateur, photo de profil (optionnelle) ;</li>
          <li><strong className="text-text-primary">Données de transaction</strong> : historique des achats et ventes, montants, adresses de livraison ;</li>
          <li><strong className="text-text-primary">Contenu publié</strong> : photos d'objets, descriptions, messages entre utilisateurs ;</li>
          <li><strong className="text-text-primary">Données de connexion</strong> : adresse IP, type d'appareil, système d'exploitation, logs de connexion ;</li>
          <li><strong className="text-text-primary">Données de paiement</strong> : gérées directement par Stripe — Pépite ne stocke aucune donnée bancaire.</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>créer et gérer votre compte utilisateur ;</li>
          <li>traiter et sécuriser vos transactions ;</li>
          <li>faire fonctionner la messagerie entre acheteurs et vendeurs ;</li>
          <li>améliorer nos modèles d'intelligence artificielle d'estimation ;</li>
          <li>envoyer des notifications relatives à vos transactions ;</li>
          <li>prévenir la fraude et respecter nos obligations légales ;</li>
          <li>vous envoyer des communications marketing, sous réserve de votre consentement.</li>
        </ul>
      </Section>

      <Section title="4. Intelligence artificielle et photos">
        <p>
          Lorsque vous soumettez des photos d'objets à notre service d'analyse IA, ces images sont transmises à Google
          (via l'API Gemini) pour analyse. Elles ne sont pas conservées par Google au-delà du traitement de la requête.
          Pépite conserve uniquement les photos que vous choisissez de publier dans vos annonces.
        </p>
        <p>
          Les photos de visages ou de personnes soumises à l'IA sont immédiatement rejetées et ne sont pas traitées.
        </p>
      </Section>

      <Section title="5. Base légale">
        <p>Le traitement de vos données est fondé sur :</p>
        <ul>
          <li><strong className="text-text-primary">L'exécution du contrat</strong> : pour tout ce qui est nécessaire au fonctionnement du service ;</li>
          <li><strong className="text-text-primary">Le consentement</strong> : pour les notifications marketing ;</li>
          <li><strong className="text-text-primary">L'intérêt légitime</strong> : pour la prévention de la fraude et l'amélioration du service ;</li>
          <li><strong className="text-text-primary">L'obligation légale</strong> : pour la conservation des données de transaction.</li>
        </ul>
      </Section>

      <Section title="6. Partage des données">
        <p>Vos données peuvent être partagées avec :</p>
        <ul>
          <li><strong className="text-text-primary">Stripe</strong> : traitement des paiements (politique disponible sur stripe.com) ;</li>
          <li><strong className="text-text-primary">Google (Gemini API)</strong> : analyse d'images pour l'estimation IA ;</li>
          <li><strong className="text-text-primary">Supabase</strong> : hébergement de la base de données et authentification ;</li>
          <li><strong className="text-text-primary">Sendcloud</strong> : génération des étiquettes d'expédition ;</li>
          <li><strong className="text-text-primary">Les autres utilisateurs</strong> : votre pseudo, photo de profil et annonces sont publics par nature.</li>
        </ul>
        <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>
      </Section>

      <Section title="7. Conservation des données">
        <p>
          Vos données de compte sont conservées tant que votre compte est actif. Après suppression du compte, vos données
          personnelles sont effacées sous 30 jours, à l'exception des données de transaction conservées 5 ans
          conformément aux obligations comptables et fiscales.
        </p>
        <p>
          Les messages entre utilisateurs sont conservés 2 ans après la clôture de la transaction associée.
        </p>
      </Section>

      <Section title="8. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong className="text-text-primary">Accès</strong> : obtenir une copie de vos données personnelles ;</li>
          <li><strong className="text-text-primary">Rectification</strong> : corriger des données inexactes ;</li>
          <li><strong className="text-text-primary">Effacement</strong> : demander la suppression de vos données (« droit à l'oubli ») ;</li>
          <li><strong className="text-text-primary">Portabilité</strong> : recevoir vos données dans un format structuré ;</li>
          <li><strong className="text-text-primary">Opposition</strong> : vous opposer à certains traitements ;</li>
          <li><strong className="text-text-primary">Limitation</strong> : demander la limitation du traitement.</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à <strong className="text-text-primary">privacy@pepite.app</strong> ou
          via la fonction « Supprimer mon compte » dans les paramètres de l'application.
          Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          Le site web Pépite utilise uniquement des cookies strictement nécessaires au fonctionnement du service
          (authentification, panier). Aucun cookie de traçage publicitaire tiers n'est déposé sans votre consentement.
        </p>
      </Section>

      <Section title="10. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
          chiffrement en transit (HTTPS/TLS), chiffrement au repos, authentification à deux facteurs disponible,
          accès aux données limité au personnel autorisé.
        </p>
      </Section>

      <Section title="11. Modifications">
        <p>
          Nous pouvons mettre à jour cette politique à tout moment. En cas de modification substantielle, vous serez
          notifié par email ou via une notification dans l'application au moins 30 jours avant l'entrée en vigueur
          des changements.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-text-primary mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
