import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Pépite",
};

export default function CguPage() {
  return (
    <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
      <div>
        <h1 className="font-serif text-4xl text-text-primary mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-text-muted text-xs">Dernière mise à jour : mai 2025</p>
      </div>

      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la
          plateforme Pépite, disponible via l'application mobile et le site web <strong className="text-text-primary">pepite.app</strong>
          (ci-après « la Plateforme »), éditée par la société AGENCE LEVEL UP, SAS au capital de 22 350 €,
          immatriculée au RCS de Paris sous le numéro 820 038 685, dont le siège social est situé
          47 rue Lauriston, 75016 Paris (ci-après « l'Éditeur »).
        </p>
        <p>
          Pépite est une place de marché permettant aux particuliers d'acheter et de vendre des objets de seconde main,
          assistée par une intelligence artificielle pour l'estimation et la description des objets.
        </p>
      </Section>

      <Section title="2. Acceptation des CGU">
        <p>
          L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas
          ces conditions, veuillez ne pas utiliser la Plateforme.
        </p>
      </Section>

      <Section title="3. Inscription et compte">
        <p>
          L'accès aux fonctionnalités de vente et d'achat nécessite la création d'un compte. Vous vous engagez à fournir
          des informations exactes, à maintenir la confidentialité de vos identifiants et à notifier immédiatement Pépite
          de toute utilisation non autorisée de votre compte.
        </p>
        <p>
          Vous devez être âgé d'au moins 18 ans ou, si vous êtes mineur, disposer de l'autorisation d'un représentant légal.
        </p>
      </Section>

      <Section title="4. Publication d'annonces">
        <p>En publiant une annonce sur Pépite, vous déclarez et garantissez que :</p>
        <ul>
          <li>vous êtes l'unique propriétaire de l'objet mis en vente ;</li>
          <li>l'objet n'est pas volé, contrefait, dangereux ou illégal à la vente ;</li>
          <li>les photos et descriptions fournies sont exactes et non trompeuses ;</li>
          <li>vous vous engagez à expédier l'objet ou à le remettre dans les délais convenus après la vente.</li>
        </ul>
        <p>
          L'estimation de prix générée par l'IA est fournie à titre indicatif uniquement. Elle ne constitue pas une garantie
          de valeur et ne lie pas Pépite.
        </p>
      </Section>

      <Section title="5. Transactions et paiements">
        <p>
          Les paiements sont traités par Stripe, prestataire tiers certifié PCI-DSS. Pépite perçoit une commission de 8 %
          sur le montant total de chaque transaction (article + livraison), réduite à 4 % pour les bénéficiaires du programme
          de parrainage.
        </p>
        <p>
          Les vendeurs doivent activer un compte Stripe Connect pour recevoir leurs paiements. Les fonds sont transférés
          après confirmation de la réception par l'acheteur ou expiration du délai de litige (7 jours).
        </p>
      </Section>

      <Section title="6. Protection acheteur">
        <p>
          En cas de non-conformité de l'objet reçu (objet non conforme à la description, non reçu ou endommagé), l'acheteur
          dispose de 7 jours après réception pour ouvrir un litige via la Plateforme. Pépite examinera le litige et pourra
          ordonner le remboursement partiel ou total.
        </p>
      </Section>

      <Section title="7. Contenu interdit">
        <p>Il est strictement interdit de publier ou vendre :</p>
        <ul>
          <li>des armes, munitions et accessoires d'armes ;</li>
          <li>des substances illicites ou médicaments soumis à prescription ;</li>
          <li>des espèces animales ou végétales protégées ;</li>
          <li>des biens volés, contrefaits ou issus d'activités illicites ;</li>
          <li>tout contenu à caractère pornographique, haineux ou discriminatoire.</li>
        </ul>
        <p>
          Pépite se réserve le droit de supprimer toute annonce ne respectant pas ces règles et de suspendre ou clôturer
          le compte de l'utilisateur concerné, sans préjudice des poursuites judiciaires éventuelles.
        </p>
      </Section>

      <Section title="8. Intelligence artificielle">
        <p>
          La Plateforme utilise des services d'intelligence artificielle pour analyser les photos d'objets et générer des
          estimations de prix et descriptions. Ces estimations sont automatisées et peuvent contenir des erreurs.
          Elles n'engagent pas la responsabilité de Pépite.
        </p>
        <p>
          L'IA ne peut pas certifier l'authenticité des objets présentés. Toute déclaration d'authenticité relève de la
          seule responsabilité du vendeur.
        </p>
      </Section>

      <Section title="9. Propriété intellectuelle">
        <p>
          En publiant du contenu sur la Plateforme (photos, descriptions, avis), vous accordez à Pépite une licence
          mondiale, non exclusive, gratuite et transférable pour utiliser, reproduire et afficher ce contenu dans le
          cadre du fonctionnement de la Plateforme.
        </p>
      </Section>

      <Section title="10. Responsabilité">
        <p>
          Pépite agit en qualité d'intermédiaire et n'est pas partie aux transactions entre acheteurs et vendeurs.
          Pépite ne peut être tenue responsable des préjudices résultant d'un achat ou d'une vente réalisé via la
          Plateforme, sous réserve des dispositions légales impératives applicables.
        </p>
      </Section>

      <Section title="11. Modification et résiliation">
        <p>
          Pépite se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur
          dès leur publication sur la Plateforme. La poursuite de l'utilisation de la Plateforme après modification vaut
          acceptation des nouvelles conditions.
        </p>
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. Pépite peut suspendre
          ou supprimer un compte en cas de violation des CGU.
        </p>
      </Section>

      <Section title="12. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une
          solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du siège social d'AGENCE LEVEL UP SAS.
        </p>
        <p>
          Conformément à l'article L.616-1 du Code de la consommation, vous pouvez recourir à un médiateur de la
          consommation pour tout litige n'ayant pas pu être résolu à l'amiable.
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
